import AppShell from "@/components/AppShell";

export default function DashboardPage() {
  return (
    <AppShell>
      <h2 className="my-6 text-2xl font-semibold text-gray-700 dark:text-gray-200">
        Inicio
      </h2>

      {/* Bienvenida */}
      <div className="mb-8 p-4 rounded-lg shadow-md bg-[#FCDB52] text-gray-900">
        <p className="text-sm font-semibold">
          ¡Bienvenid@ a la app del grupo scout!
        </p>
        <p className="text-sm mt-1 text-gray-800">
          Desde el menú vas a poder acceder a la información y gestiones según tu rol.
        </p>
      </div>

      {/* Placeholder cards (después lo conectamos a datos reales) */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Próximo paso" value="Crear pantallas" />
        <Card title="Estado" value="Login OK" />
        <Card title="Rol" value="Menú dinámico" />
        <Card title="Pendiente" value="ABMs" />
      </div>
    </AppShell>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
      <div className="p-3 mr-4 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
        <span className="font-bold">•</span>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{value}</p>
      </div>
    </div>
  );
}
