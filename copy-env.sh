# init-env.sh
#!/bin/sh
if [ ! -f ./backend/.env ]; then
  cp ./backend/sample.env ./backend/.env
fi

if [ ! -f ./frontend/.env ]; then
  cp ./frontend/sample.env ./frontend/.env
fi
