import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-display text-9xl font-extrabold text-brand-600">4<span className="text-hot">0</span>4</p>
        <h1 className="text-3xl font-extrabold uppercase">This page took a wrong turn</h1>
        <p className="mt-2 text-muted">The page you are looking for does not exist or was moved.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-brand-600 px-8 py-3 font-bold text-white">Back to home</Link>
      </div>
    </div>
  );
}
