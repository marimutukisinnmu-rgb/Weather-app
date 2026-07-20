#!/bin/zsh
# macOSのターミナルで「zsh build_macos.command」と実行する。
# /usr/local/bin/python3 で仮想環境 bild を作り、その中でビルドする。
set -e

cd "$(dirname "$0")" || exit 1

PYTHON="/usr/local/bin/python3"

if [[ ! -x "$PYTHON" ]]; then
  echo "エラー: $PYTHON が見つかりません。Python 3をインストールしてください。"
  exit 1
fi

if [[ ! -x "bild/bin/python" ]]; then
  "$PYTHON" -m venv bild
fi

# 仮想環境を有効化する。以降のpython/pipはすべて bild を使用する。
source bild/bin/activate

if ! python -c 'import PyInstaller' >/dev/null 2>&1; then
  echo "初回セットアップ: PyInstallerをインストールしています…"
  python -m pip install --upgrade pip
  python -m pip install pyinstaller
fi

echo "ビルドを開始します…"
python -m PyInstaller --noconfirm --clean --windowed \
  --name "いまの天気・暑さ指数" \
  --add-data "今のデータ.js:." \
  weather_dashboard.py

echo "ビルド完了: dist/いまの天気・暑さ指数.app"
