# [2.1.0-beta.2](https://github.com/HaploidJS/haploid/compare/v2.1.0-beta.1...v2.1.0-beta.2) (2024-09-23)

### Bug Fixes

-   remove cypress on check-build ([6070c7c](https://github.com/HaploidJS/haploid/commit/6070c7c9cfdcf47e159863832af7f8f3bace31f4))

# [2.1.0-beta.1](https://github.com/HaploidJS/haploid/compare/v2.0.1...v2.1.0-beta.1) (2024-09-23)

### Bug Fixes

-   haploid-script no long inherits from HTMLScriptElement ([1943c58](https://github.com/HaploidJS/haploid/commit/1943c5822a03405d24cb44c1635a93eca78342b8))

## [2.0.1](https://github.com/HaploidJS/haploid/compare/v2.0.0...v2.0.1) (2024-04-26)

### Bug Fixes

-   catch error(s) if evaluating umd/global failed ([b56414f](https://github.com/HaploidJS/haploid/commit/b56414f42e94489125f82e89e1a76ae9f63c9c9d))

# [2.0.0](https://github.com/HaploidJS/haploid/compare/v1.2.0...v2.0.0) (2024-02-26)

### Bug Fixes

-   set executing context to window always ([92859a4](https://github.com/HaploidJS/haploid/commit/92859a4e9ae8f0d5a3f2704c80bb17e0f7ea869e))

### Features

-   dropURLFixInCSSByStyleSheet is enabled by default ([ab66c2d](https://github.com/HaploidJS/haploid/commit/ab66c2df313b693b59749b8d3ce199ac435a1ff9))
-   introduce jsExportType option ([8fc4be6](https://github.com/HaploidJS/haploid/commit/8fc4be6a0802d924d28cb50308c542ec781cb08b))
-   json entry supports jsExportType instead of AssetsMap ([f5634eb](https://github.com/HaploidJS/haploid/commit/f5634ebc5c292d01b67c93b1a47ffdb691a0a03e))
-   remove iife and domWrapper ([53df037](https://github.com/HaploidJS/haploid/commit/53df0373b65b62794b7e4cd0d43cb12b495276e9))
-   rename UMDExportResolver to GlobalExportResolver ([81d2171](https://github.com/HaploidJS/haploid/commit/81d21711582fb280d3d799ecddfed4b2e612f00c))
-   support externals option ([ff72dba](https://github.com/HaploidJS/haploid/commit/ff72dba7aa049b66fca0e5b6532de42ad6de5184))
-   support real UMD ([5389afe](https://github.com/HaploidJS/haploid/commit/5389afe82c77b62e3b8321a7641596882e716e2e))

# [2.0.0-next.20231123.10](https://github.com/HaploidJS/haploid/compare/v2.0.0-next.20231122.21...v2.0.0-next.20231123.10) (2023-11-23)

### Bug Fixes

-   set executing context to window always ([c955cf7](https://github.com/HaploidJS/haploid/commit/c955cf75714237da4b5ef1f7d151426acc89d3ee))

# [2.0.0-next.20231122.21](https://github.com/HaploidJS/haploid/compare/v1.2.0...v2.0.0-next.20231122.21) (2023-11-22)

### Features

-   dropURLFixInCSSByStyleSheet is enabled by default ([064800c](https://github.com/HaploidJS/haploid/commit/064800c3201cb986f8183f067378308572c4426f))
-   introduce jsExportType option ([39f533a](https://github.com/HaploidJS/haploid/commit/39f533aa8c076a06746f254d245c1e1514253cf5))
-   remove iife and domWrapper ([0a9bc7f](https://github.com/HaploidJS/haploid/commit/0a9bc7f5e617f09ddc28ec69ce0cbb522a9bb149))
-   rename UMDExportResolver to GlobalExportResolver ([68d5a93](https://github.com/HaploidJS/haploid/commit/68d5a93018e665f7cb00a8d32e04276836e0e3ac))
-   support externals option ([d5f83d4](https://github.com/HaploidJS/haploid/commit/d5f83d48072646c97e85ad89c12dd9dd07196eb2))
-   support real UMD ([39b36a5](https://github.com/HaploidJS/haploid/commit/39b36a50d98bd73c87e5eb5896c54677b8b3b1f3))

## 1.2.0 (2023-11-14)

-   test: refactor e2e ([28fe637](https://github.com/HaploidJS/haploid/commit/28fe637))
-   test: replace jest deprecated API ([92f68f3](https://github.com/HaploidJS/haploid/commit/92f68f3))
-   test(load-from-entry): refactor e2e cases ([1e8fe93](https://github.com/HaploidJS/haploid/commit/1e8fe93))
-   feat: change fallbackOnlyWhen type to Activity\n\nBREAKING CHANGE: string with "#" prefix passed to ([f394d8c](https://github.com/HaploidJS/haploid/commit/f394d8c))
-   feat: skip unmount if ever unmount successfully before or no mount before when unloading ([ca3095a](https://github.com/HaploidJS/haploid/commit/ca3095a))
-   chore: reference single-spa to LICENSE ([63610ad](https://github.com/HaploidJS/haploid/commit/63610ad))

## 1.1.0 (2023-11-13)

-   feat: prevent necessary unmount ([6dc8108](https://github.com/HaploidJS/haploid/commit/6dc8108))

## <small>1.0.1 (2023-11-01)</small>

-   ci: add release script ([ef810bc](https://github.com/HaploidJS/haploid/commit/ef810bc))
-   chore: add changelog ([9f7456c](https://github.com/HaploidJS/haploid/commit/9f7456c))
-   chore: update license ([7a96150](https://github.com/HaploidJS/haploid/commit/7a96150))
-   chore: update README.md and copyright ([c4c4a44](https://github.com/HaploidJS/haploid/commit/c4c4a44))
-   feat: assigning window.self/parent/top is forbidden ([cf4572e](https://github.com/HaploidJS/haploid/commit/cf4572e))
-   docs: update README.md ([a0c335c](https://github.com/HaploidJS/haploid/commit/a0c335c))

## 1.0.0 (2023-10-27)

-   ci: fix publish ([87d0379](https://github.com/HaploidJS/haploid/commit/87d0379))
-   test(sandbox): fix document.styleSheets ([55e9e80](https://github.com/HaploidJS/haploid/commit/55e9e80))
-   feat: Initial commit ([3b03f10](https://github.com/HaploidJS/haploid/commit/3b03f10))
