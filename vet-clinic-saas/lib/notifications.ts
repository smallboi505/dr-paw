import { prisma } from "@/lib/prisma";

type NotificationType = "APPOINTMENT" | "PET" | "VISIT" | "STAFF";

interface CreateNotificationParams {
  userId: string;
  clinicId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Check if user has this notification type enabled
 */
async function shouldNotifyUser(userId: string, type: NotificationType): Promise<boolean> {
  try {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // If no preferences, default to true (notify)
    if (!prefs) return true;

    // Check based on notification type
    switch (type) {
      case "APPOINTMENT":
        return prefs.appointmentConfirmations;
      case "PET":
        return prefs.newPetRegistration;
      case "VISIT":
        return prefs.systemAlerts;
      case "STAFF":
        return prefs.staffUpdates;
      default:
        return true;
    }
  } catch (error) {
    console.error("Error checking notification preferences:", error);
    // On error, default to notifying
    return true;
  }
}

/**
 * Create a notification for a user (only if they have it enabled)
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // Check if user wants this notification type
    const shouldNotify = await shouldNotifyUser(params.userId, params.type);
    if (!shouldNotify) {
      console.log(`User ${params.userId} has disabled ${params.type} notifications`);
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        clinicId: params.clinicId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Create notifications for all admins in a clinic
 */
export async function notifyAdmins(
  clinicId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        clinicId,
        role: "ADMIN",
      },
      select: { id: true },
    });

    const notifications = await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          clinicId,
          type,
          title,
          message,
          link,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error("Failed to notify admins:", error);
    return [];
  }
}

/**
 * Create notifications for all vets in a clinic
 */
export async function notifyVets(
  clinicId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    const vets = await prisma.user.findMany({
      where: {
        clinicId,
        role: "VET",
      },
      select: { id: true },
    });

    const notifications = await Promise.all(
      vets.map((vet) =>
        createNotification({
          userId: vet.id,
          clinicId,
          type,
          title,
          message,
          link,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error("Failed to notify vets:", error);
    return [];
  }
}

/**
 * Create notifications for all staff in a clinic
 */
export async function notifyAllStaff(
  clinicId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    const staff = await prisma.user.findMany({
      where: { clinicId },
      select: { id: true },
    });

    const notifications = await Promise.all(
      staff.map((member) =>
        createNotification({
          userId: member.id,
          clinicId,
          type,
          title,
          message,
          link,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error("Failed to notify all staff:", error);
    return [];
  }
}