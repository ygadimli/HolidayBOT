#!/bin/bash

echo "HOLIDAYBOT - @ygadimli - Yunis Gadimli"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "🖥️  Backend..."
cd "$DIR/backend" || exit
node server.js &
BACKEND_PID=$!

echo "🎨 Frontend..."
cd "$DIR/frontend" || exit
npm run dev &
FRONTEND_PID=$!

sleep 3

echo "=========================================================="
echo "🎯 Hərşey hazırdır"
echo "🌐 İnterfeys: http://localhost:5173" (ya da IP:5173)
echo "🛑 Bütün sistemi dayandırmaq üçün CTRL+C basın."
echo "=========================================================="

xdg-open http://localhost:5173 2>/dev/null &

trap "echo -e '\nSistem dayandırılır...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

wait $BACKEND_PID
wait $FRONTEND_PID
