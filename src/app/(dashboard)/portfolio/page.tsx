export default function PortfolioPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">포트폴리오</h1>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
        종목·자산유형·국가·거래소·계좌별 비중이 도넛 차트로 표시됩니다. 비중 계산
        로직은 포팅·검증되어 있습니다 (portfolioWeight usecase).
      </div>
    </div>
  );
}
