'use client';

/**
 * 합지 vs 실크 완벽 비교 가이드
 * SEO 키워드: 합지 실크 차이, 도배 벽지 종류, 어떤 벽지 골라야
 */

const COMPARISON_ROWS = [
  {
    item: '가격대 (평당)',
    hanji: '4,500원~6,000원',
    silk: '8,000원~16,000원',
  },
  {
    item: '시공 난이도',
    hanji: '쉬움 (덧방 가능)',
    silk: '어려움 (철거 필수)',
  },
  {
    item: '내구성',
    hanji: '5~7년',
    silk: '10년+',
  },
  {
    item: '청소',
    hanji: '물걸레 불가',
    silk: '물걸레 가능 (PVC 코팅)',
  },
  {
    item: '발색·질감',
    hanji: '단순 무광',
    silk: '풍부함 (다양한 패턴)',
  },
  {
    item: '추천 공간',
    hanji: '임대·원룸·방',
    silk: '거실·신축·프리미엄',
  },
  {
    item: '주의사항',
    hanji: '오염·수분에 약함',
    silk: '가격 부담, 철거비 발생',
  },
];

const GUIDES = [
  {
    title: '합지의 장단점',
    body: '합지는 기존 벽지 위에 그대로 시공하는 덧방이 가능해 철거비와 작업 시간을 절약할 수 있습니다. 가격이 저렴해 임대 세대나 단기 거주 공간에 적합합니다. 다만 PVC 코팅이 없어 물기나 오염에 취약하고 내구성이 실크보다 낮아 5~7년 주기로 재시공이 필요합니다.',
  },
  {
    title: '실크의 장단점',
    body: 'PVC 코팅으로 표면이 매끄러워 물걸레 청소가 가능하고 내구성이 10년 이상으로 길어 장기 거주 공간에 유리합니다. 거실·주방처럼 오염이 잦은 공간에 특히 추천됩니다. 단점은 합지보다 평당 2~3배 비싸고 기존 벽지를 반드시 철거해야 해 전체 비용이 크게 증가합니다.',
  },
  {
    title: '친환경·방염 벽지 활용',
    body: '어린이방이나 침실에는 포름알데히드 방출량이 낮은 친환경 인증 벽지를 추천합니다. 방염 벽지는 불꽃 확산을 억제해 안전을 높이며 공공건물·고층 주거에서 필수로 지정되는 경우도 있습니다. 가격은 실크(고급)~수입벽지 사이 수준으로, 건강·안전 가치를 중시하는 가정에 적합합니다.',
  },
  {
    title: '수입벽지 활용',
    body: '국내 벽지에 없는 독창적인 패턴과 질감을 원할 때 활용합니다. 거실 한 면에 포인트로 시공하는 방식이 일반적이며, 나머지 벽면은 국내 실크 벽지와 조합해 비용을 조절합니다. 롤당 단가가 높고 로스율이 크므로 사전에 물량 계산을 꼼꼼히 확인해야 합니다.',
  },
  {
    title: '추천 가이드 (예산별·공간별)',
    body: '예산이 제한적이라면 합지(소폭) 또는 광폭합지로 전체 시공 후 거실 한 면만 포인트 벽지를 적용하는 방식이 효율적입니다. 자녀가 있는 가정은 방에 친환경 벽지, 거실은 실크(중급)를 권장합니다. 신축 입주나 장기 거주 예정이라면 전체 실크 시공으로 관리 편의성과 내구성을 높이는 것이 장기적으로 경제적입니다.',
  },
];

export default function WallpaperComparisonGuide() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">
        합지 vs 실크 — 벽지 선택 완벽 가이드
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        벽지 종류별 특징을 비교하고 공간·예산에 맞는 선택을 도와드립니다.
      </p>

      {/* 비교 표 */}
      <div className="overflow-x-auto rounded-xl border border-slate-700 mb-10">
        <table className="w-full text-sm min-w-[480px] border-collapse">
          <thead>
            <tr className="bg-blue-600/20">
              <th className="px-4 py-3 text-left text-blue-200 font-semibold border-b border-slate-700 w-32">
                항목
              </th>
              <th className="px-4 py-3 text-center text-blue-200 font-semibold border-b border-slate-700">
                합지 (소폭 / 광폭)
              </th>
              <th className="px-4 py-3 text-center text-blue-200 font-semibold border-b border-slate-700">
                실크 (보급~고급)
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, i) => (
              <tr
                key={row.item}
                className={i % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-800/20'}
              >
                <td className="px-4 py-2.5 font-medium text-slate-300 border-b border-slate-700/50">
                  {row.item}
                </td>
                <td className="px-4 py-2.5 text-center text-slate-200 border-b border-slate-700/50">
                  {row.hanji}
                </td>
                <td className="px-4 py-2.5 text-center text-blue-300 border-b border-slate-700/50">
                  {row.silk}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 상세 가이드 */}
      <div className="space-y-6">
        {GUIDES.map((g) => (
          <div key={g.title}>
            <h3 className="text-base font-semibold text-blue-300 mb-2">
              {g.title}
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">{g.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
