# Tygit

```code
npm i -g tygit

tygit ../git-repo
```

![](https://res.cloudinary.com/dmtrk3yns/image/upload/q_auto:best/v1539786875/asd_evufbh.jpg)

### Prerequisites

**sed** - You must have "sed", a unix utility that parses and transforms text. It is necessary to remove the leading plus/minus from the lines in diff.But mainly [v2.0.0](https://github.com/vaheqelyan/tygit/releases/tag/v2.0.0)

### Features/Goals

- [x] Ability to commit file
- [x] Ability to create a new branch
- [x] Ability to add file contents to the index
- [x] Ability to delete the branch
- [x] Ability to merge branches
- [ ] Ability to checkout
- [x] Ability to pull
- [x] Do a git push with extra parameters
- [x] Ability to push
- [x] Do a git push with extra parameters
- [x] Ability to reload the working tree status
- [x] Ability to show changes between commits, commit and working tree, etc
- [ ] Show commit log when file changes
- [ ] Support all terminals ( [See more](https://github.com/vaheqelyan/tygit/blob/master/TERMINAL_SUPPORT.md) )
- [ ] Ability to ignore file
- [ ] Performance
- [ ] Packaging into an executable
- [ ] Write some implementations from scratch
- [ ] Run git reset
- [ ] Better message output
- [x] Better implementation of git-diff

> I did not include the resolution of conflicts in this list, because I believe that resolving conflicts with the terminal will not make you productive at all, especially working with large files.

See the [Cheat Sheet](https://github.com/vaheqelyan/tygit/blob/master/CHEAT_SHEET.md)

---

The basic implementation of GIT commands that we use every day, only with a good terminal interface, inspired by [lazygit](https://github.com/jesseduffield/lazygit)
