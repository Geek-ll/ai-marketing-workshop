export function health(req, res) {
  res.json({
    code: 0,
    message: 'ok',
    data: { status: 'up', time: new Date().toISOString() },
  })
}
