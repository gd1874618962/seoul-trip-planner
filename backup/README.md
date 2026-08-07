# 备份与恢复

## 备份策略

项目使用 Git tag 作为版本备份点。当前稳定版本：

```text
v1.0-final
```

后续每次大改动前建议先打 tag：

```bash
git tag v1.1.0
git push origin v1.1.0
```

## 恢复

如果代码被改坏，恢复到备份版本：

```bash
git fetch --tags
git checkout v1.0-final
```

## 在线备份

- 源码分支：`source`
- 站点分支：`main`（GitHub Pages 自动部署）
- 两个分支都在 GitHub：https://github.com/gd1874618962/seoul-trip-planner
