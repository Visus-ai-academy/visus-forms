export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Lado esquerdo: branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        {/* Padrão decorativo de fundo */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="150" r="300" stroke="white" strokeWidth="1" fill="none" />
            <circle cx="600" cy="450" r="250" stroke="white" strokeWidth="1" fill="none" />
            <circle cx="400" cy="300" r="200" stroke="white" strokeWidth="0.5" fill="none" />
            <path d="M0 400 Q200 350 400 400 T800 400" stroke="white" strokeWidth="1" fill="none" />
            <path d="M0 450 Q200 400 400 450 T800 450" stroke="white" strokeWidth="0.5" fill="none" />
            <path d="M0 500 Q200 450 400 500 T800 500" stroke="white" strokeWidth="0.5" fill="none" />
          </svg>
        </div>

        <div className="relative z-10 text-center px-12 space-y-8">
          <img
            src="/LOGOTIPO_V1.png"
            alt="Visus"
            className="h-24 mx-auto object-contain brightness-0 invert"
          />
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white font-heading">
              Bem-vindo de volta!
            </h2>
            <p className="text-white/70 text-sm max-w-sm mx-auto">
              Acesse sua conta para gerenciar seus formulários e workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Lado direito: formulário */}
      <div className="flex-1 flex items-center justify-center bg-surface px-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
