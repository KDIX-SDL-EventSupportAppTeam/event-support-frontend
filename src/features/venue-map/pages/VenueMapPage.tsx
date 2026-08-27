// 2026年版の会場マップ素材が未着のため、暫定でビンゴ盤の空グリッド画像を代用する。
// 差し替え時はこの定数のみを直せばよい（素材は public/map/venue-map.png として置く想定）。
const VENUE_MAP_IMAGE = '/bingo/bingo-grid-empty.png' // TODO: 会場マップ素材の受領後に差し替え

export function VenueMapPage() {
  return (
    <div className="venue-map-page container py-3 px-2">
      <h1 className="main-title">会場マップ</h1>
      <div className="venue-map-scroll" style={{ overflow: 'auto', touchAction: 'pinch-zoom' }}>
        <img
          src={VENUE_MAP_IMAGE}
          alt="会場マップ"
          className="venue-map-image"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  )
}
