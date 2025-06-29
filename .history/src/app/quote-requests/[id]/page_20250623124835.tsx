export default function QuoteRequestDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">견적 상세 페이지</h1>
      <p>견적 ID: {params.id}</p>
    </div>
  );
} 