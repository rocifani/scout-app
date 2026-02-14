export default function DashboardPage() {
  return (
    <>
      <h2 className="my-6 text-2xl font-semibold text-gray-700 dark:text-gray-200">
        Inicio
      </h2>

      <div className="bg-yellow-100/90 text-gray-900 p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-2">
          ¡Bienvenid@ a la App del Grupo Scout Pablo Apóstol! 🌟
        </h3>

        <p className="mb-3">
          Desde aquí podés seguir de cerca toda la información importante.
        </p>

        <ul className="space-y-2 text-sm">
          <li>✅ <strong>Perfil de mi hijo/a:</strong> consultá sus datos personales y generales.</li>
          <li>✅ <strong>Detalle de Autorizaciones:</strong> verificá las autorizaciones entregadas.</li>
          <li>✅ <strong>Detalle de Cuotas:</strong> seguí el estado de cuotas y afiliaciones.</li>
          <li>✅ <strong>Mis Ventas:</strong> revisá las ventas realizadas y el aporte al fondo individual para el Campamento Final.</li>
        </ul>

        <p className="mt-4 text-sm">
          Ante cualquier duda, podés comunicarte con el equipo de educadores.
        </p>
      </div>
    </>
  );
}
