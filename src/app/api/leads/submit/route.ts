export function POST() {
  return Response.json({ error: 'Приём заявок завершён' }, { status: 410 })
}
