# MEGAMOJI デスクトップアプリ化について

Electron でラップして、Windows / Mac どちらでも「アイコンをダブルクリックで起動」できるようにしました。
配布先の人は Node.js 不要です(Electron が Chromium ごと同梱されるため)。

## 仕組み

- `electron/main.js` が起動すると、アプリ内部で小さなローカルサーバー(127.0.0.1のランダムな空きポート)を立てて
  `dist/` フォルダ(=`npm run build` の成果物)を配信し、ウィンドウでそれを表示します。
- `file://` で直接開くと GIF エンコード用の Web Worker が動かないブラウザがあるため、
  あえてローカルサーバー経由にしています。

## 使い方(すでにビルド済みのものを使う場合)

### Windows

同梱の `MEGAMOJI-Windows` フォルダの中の **`MEGAMOJI.exe` をダブルクリック**すれば起動します。
フォルダごと配布してください(exe単体だけでは動きません。中の dll 等一式が必要です)。

### Mac

このLinux環境ではMac向けのビルド(.app)を作ることができませんでした
(electron-builderのmacターゲットは実機のmacOS上でしかビルドできない制約があります)。
下記の「自分でビルドする」を、お手持ちのMacか、GitHub Actions(後述)で行ってください。

## 自分でビルドする場合

前提: ビルドする側のPCにだけ Node.js が必要です(配布先には不要)。

```bash
npm install

# Windows用(.exeを含むフォルダ、または環境が整っていればポータブル1ファイル)
npm run dist:win

# Mac用(.app。実行は同じOS上で。dmgにしたい場合は build.mac.target を "dmg" に変更)
npm run dist:mac

# Linux用(動作確認したもの)
npm run dist:linux
```

生成物は `release/` フォルダに出力されます。

- `release/win-unpacked/MEGAMOJI.exe` … ダブルクリックで起動
- `release/mac/MEGAMOJI.app` … ダブルクリックで起動
- `release/linux-unpacked/megamoji` … ダブルクリック or 実行で起動

### Windowsの単一exe化について

`package.json` の `build.win.target` は `"portable"`(1ファイルのexeにまとめる形式)にしてありますが、
これを完成させるには内部で NSIS というツールを使います。Windows上でビルドすればそのまま動きますが、
Linux上でビルドする場合は `wine` が必要です。`win-unpacked` フォルダ形式でも配布・起動には支障ありません。

### Macを持っていない場合(GitHub Actionsで自動ビルド)

`.github/workflows/desktop-build.yml` を用意してあります。これを使うと、
Macを持っていなくてもGitHub上の仮想Mac環境で `.app` を自動生成できます
(ついでにWindows版・Linux版も同時にビルドされます)。

1. このプロジェクトをGitHubリポジトリにpushする(まだの場合は新規リポジトリを作成)
   ```bash
   cd MEGAMOJI-master
   git init
   git add .
   git commit -m "Add Electron desktop app support"
   git branch -M main
   git remote add origin https://github.com/cota4106/MEGAMOJI_Kaizo.git
   git push -u origin main
   ```
2. GitHubのリポジトリページ → 上部タブの **Actions** を開く
3. 左側の **Build desktop app** をクリック
4. 右側の **Run workflow** ボタン → 緑の **Run workflow** で実行
5. 数分待つと、その実行結果のページ下部の **Artifacts** に
   `MEGAMOJI-mac` / `MEGAMOJI-windows` / `MEGAMOJI-linux` の3つがダウンロードできる状態で並びます
   - `MEGAMOJI-mac` をダウンロードして解凍すると `.app` が入っています。ダブルクリックで起動できます
     (未署名アプリなので、初回は右クリック→「開く」が必要になる場合があります)

タグ(`v1.0.0` など)をpushしたときも自動でこのビルドが走るようにしてあります。

## 開発中の確認

```bash
npm run electron:dev
```

`dist/` をビルドしてから Electron ウィンドウを起動します(配布用パッケージ化はしません)。
