import Link from 'next/link';

export default function QuoteRequestsListPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">전체 견적 요청 리스트</h1>
      <ul>
        <li className="mb-2">
          <Link href="/quote-requests/1" className="text-blue-500 hover:underline">
            견적 1
          </Link>
        </li>
        <li className="mb-2">
          <Link href="/quote-requests/2" className="text-blue-500 hover:underline">
            견적 2
          </Link>
        </li>
      </ul>
    </div>
  );
} 