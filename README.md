# MyAlbum - アルバムをつくろう

画像フォルダから EPUB 電子書籍を生成する Tauri + React 製のデスクトップアプリです。

## 開発環境

- Node.js 20 以上
- Rust stable
- Windows では Visual Studio C++ Build Tools

## ローカル起動

```powershell
npm install
npm run tauri dev
```

## ローカルの portable ビルド

```powershell
npm install
npx tauri build --no-bundle
```

生成物は `src-tauri\target\release\myalbum.exe` です。

## GitHub Actions リリース

1. 変更を `master` ブランチへ反映します。
2. リリース対象コミットに `v1.0.0` のようなタグを付けて push します。
3. `.github\workflows\release.yml` が Windows 用 portable ビルドを実行します。
4. GitHub Release に `MyAlbum-v1.0.0-windows-x64-portable.zip` を添付します。

ZIP の直下には `myalbum.exe` だけを配置し、インストーラーは作成しません。

## 配布時の注意

- この配布形式は Windows 向けの portable 版です。
- 実行には Microsoft WebView2 Runtime が必要です。
- Windows 11 と多くの Windows 10 環境では標準搭載済みですが、未導入環境では Microsoft 公式の WebView2 Runtime を追加してください。
