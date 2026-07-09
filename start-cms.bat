@echo off
echo.
echo  InfraMindTech CMS Server
echo  ========================
echo  Installing dependencies...
pip install -r requirements.txt -q
echo.
python server.py
pause
