export function getMakassarTime() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Makassar",
    })
  );
}
