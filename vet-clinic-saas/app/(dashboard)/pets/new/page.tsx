import { AddPetForm } from "@/components/forms/add-pet-form";

export default function NewPetPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Register New Pet</h1>
          <p className="text-slate-600 mt-2">Add a new pet to the system</p>
        </div>
        
        <AddPetForm />
      </div>
    </div>
  );
}