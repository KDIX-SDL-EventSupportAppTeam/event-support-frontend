const VENUE_MAP_IMAGE = '/map/venue-map.webp'

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
