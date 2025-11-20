import QuickRecord from "@/components/quickRecord";

function RecordPage() {
  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Track Your Meals</h1>

      <div className="w-full max-w-md">
        <QuickRecord />
      </div>
    </div>
  );
}

export default RecordPage;
