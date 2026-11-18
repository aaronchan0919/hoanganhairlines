const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type"
  }
});

const PROVIDERS = [
  { id: "amadeus", name: "Amadeus", status: "not_configured", note: "Cần thông tin API và quyền truy cập phù hợp." },
  { id: "traveloka", name: "Traveloka", status: "partner_access_required", note: "Cần quyền truy cập API/đối tác." },
  { id: "cheapoair", name: "CheapOair", status: "partner_access_required", note: "Cần quyền truy cập API/đối tác." },
  { id: "flighthub", name: "FlightHub", status: "partner_access_required", note: "Cần quyền truy cập API/đối tác." },
  { id: "cheapair", name: "CheapAir", status: "partner_access_required", note: "Cần quyền truy cập API/đối tác." },
  { id: "travelport", name: "Travelport", status: "not_configured", note: "Cần hợp đồng/API credentials." },
  { id: "sabre", name: "Sabre", status: "not_configured", note: "Cần hợp đồng/API credentials." }
];

function validAirport(value) {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value.trim().toUpperCase());
}

function validateSearch(input) {
  const errors = [];
  const tripType = input.tripType;
  if (!["oneway", "roundtrip", "multicity"].includes(tripType)) errors.push("Loại hành trình không hợp lệ.");

  const segments = Array.isArray(input.segments) ? input.segments : [];
  const expected = tripType === "oneway" ? 1 : tripType === "roundtrip" ? 2 : segments.length;
  if (segments.length < 1 || (tripType === "roundtrip" && segments.length !== 2) || (tripType === "oneway" && segments.length !== 1) || (tripType === "multicity" && segments.length < 2)) {
    errors.push("Vui lòng nhập đầy đủ các chặng bay.");
  }
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i] || {};
    if (!validAirport(s.from) || !validAirport(s.to)) errors.push(`Chặng ${i + 1}: mã sân bay phải gồm 3 chữ cái.`);
    if (s.from && s.to && s.from.toUpperCase() === s.to.toUpperCase()) errors.push(`Chặng ${i + 1}: điểm đi và điểm đến không được trùng nhau.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date || "")) errors.push(`Chặng ${i + 1}: ngày bay không hợp lệ.`);
  }

  const pax = input.passengers || {};
  const adults = Number(pax.adults || 0);
  const children = Array.isArray(pax.children) ? pax.children : [];
  const infants = Number(pax.infants || 0);
  const infantsWithSeat = Number(pax.infantsWithSeat || 0);
  if (!Number.isInteger(adults) || adults < 1 || adults > 9) errors.push("Số người lớn phải từ 1 đến 9.");
  if (children.length > 8 || children.some(c => !Number.isInteger(Number(c.age)) || Number(c.age) < 2 || Number(c.age) > 11)) errors.push("Trẻ em phải từ 2 đến 11 tuổi.");
  if (!Number.isInteger(infants) || infants < 0 || infants > adults) errors.push("Số em bé ngồi lòng không được vượt số người lớn.");
  if (!Number.isInteger(infantsWithSeat) || infantsWithSeat < 0 || infantsWithSeat > 8) errors.push("Số em bé có ghế không hợp lệ.");
  if (adults + children.length + infants + infantsWithSeat > 9) errors.push("Tổng số hành khách vượt giới hạn tìm kiếm 9 người.");
  if (!["economy", "premium_economy", "business", "first"].includes(input.cabin)) errors.push("Hạng ghế không hợp lệ.");

  return { errors, segments, expected };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type"
    }});

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        app: "Hoang Anh Airlines",
        version: "0.1.0",
        providers: PROVIDERS,
        liveSearchReady: false,
        message: "Giao diện và API đã sẵn sàng; chưa có nhà cung cấp giá vé trực tiếp được kết nối."
      });
    }

    if (url.pathname === "/api/providers" && request.method === "GET") {
      return json({ providers: PROVIDERS });
    }

    if (url.pathname === "/api/search" && request.method === "POST") {
      let input;
      try { input = await request.json(); } catch { return json({ error: "Dữ liệu tìm kiếm không phải JSON hợp lệ." }, 400); }
      const { errors, segments } = validateSearch(input);
      if (errors.length) return json({ error: "Thông tin tìm kiếm chưa hợp lệ.", details: errors }, 400);

      const requestId = crypto.randomUUID();
      return json({
        requestId,
        status: "providers_not_connected",
        searchedAt: new Date().toISOString(),
        currency: input.currency || "USD",
        tripType: input.tripType,
        segments,
        passengers: input.passengers,
        cabin: input.cabin,
        offers: [],
        providers: PROVIDERS,
        notice: "Chưa có nhà cung cấp nào được cấp quyền API trong môi trường này. Không có giá trực tiếp để hiển thị; hệ thống không tạo giá ước tính hoặc giá giả."
      });
    }

    if (url.pathname === "/api/calendar" && request.method === "POST") {
      let input;
      try { input = await request.json(); } catch { return json({ error: "JSON không hợp lệ." }, 400); }
      if (!validAirport(input.from) || !validAirport(input.to) || !/^\d{4}-\d{2}-\d{2}$/.test(input.date || "")) {
        return json({ error: "Cần mã sân bay và ngày bay hợp lệ." }, 400);
      }
      return json({
        status: "providers_not_connected",
        days: [],
        notice: "Lịch giá linh hoạt sẽ hiển thị khi có nguồn giá trực tiếp. Không có dữ liệu giá để xác nhận ở thời điểm hiện tại."
      });
    }

    if (url.pathname.startsWith("/api/offers/") && url.pathname.endsWith("/reprice") && request.method === "POST") {
      return json({ error: "Không thể xác nhận lại giá: chưa có nhà cung cấp đặt chỗ được kết nối." }, 503);
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "Không tìm thấy API." }, 404);
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Hoang Anh Airlines", { status: 200 });
  }
};
