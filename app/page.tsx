import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Skogum R&D Docs</h1>
      <nav className="space-y-4">
        <ul className="list-disc pl-6">
          <li>
            <Link href="/docs/index.md" className="text-blue-500 hover:underline">
              Introduction
            </Link>
          </li>
          <li>
            <Link href="/docs/architecture.md" className="text-blue-500 hover:underline">
              Architecture
            </Link>
          </li>
          <li>
            <Link href="/docs/agents/index.md" className="text-blue-500 hover:underline">
              Agents
            </Link>
          </li>
          <li>
            <Link href="/docs/operations.md" className="text-blue-500 hover:underline">
              Operations
            </Link>
          </li>
          <li>
            <Link href="/docs/dashboard.md" className="text-blue-500 hover:underline">
              Dashboard
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}