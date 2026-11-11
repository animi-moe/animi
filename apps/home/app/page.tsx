import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-6">
      <main className="flex w-full max-w-md flex-col items-center text-center">
        <div className="flex w-full flex-col items-center gap-6 rounded-2xl bg-secondary p-8 shadow-xl transition-all duration-300">
          <div className="flex flex-col gap-2">
            <h1 className="bg-linear-to-r from-brand-cyan via-brand-white to-brand-pink bg-clip-text font-fredoka text-5xl font-semibold text-transparent">
              animi.moe
            </h1>
          </div>
        </div>

        <div className="mt-5 flex w-full flex-col items-center gap-2 rounded-2xl bg-secondary p-8 shadow-xl transition-all duration-300">
          <div className="flex flex-col gap-2">
            <h2 className="font-fredoka text-4xl font-semibold">boards</h2>
            <p className="text-text-muted">Make anime/character boards with ease!</p>
          </div>

          <a
            href="https://boards.animi.moe"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-xl font-medium text-blue-300 transition-colors duration-200 hover:text-blue-200"
          >
            <span>boards.animi.moe</span>
          </a>
        </div>
      </main>
    </div>
  );
}
