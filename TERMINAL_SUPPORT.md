**Open the issue and send a screenshot**

> You can set encode for terminal

```code
tygit ../sample --terminal linux
```

- [x] cmd
- [x] ConEmu
- [ ] Git BASH
- [ ] PowerShell
- [ ] Hyper
- [x] Cmder

### Notes

---

#### Git BASH / cygwin

Unfortunately you can't use in git bash.I need to get the size of the terminal so I can correctly perform calculations to draw layout. Because the cygwin shell isn't really a tty, it's a pipe, and i can't get columns and rows.

#### PowerShell

Displays different colors

![](https://res.cloudinary.com/dmtrk3yns/image/upload/q_auto/v1541940384/tygit_terminal_support/powershell_colors_issue.jpg)

#### Hyper

In hyper everything looks beautiful and beautiful, but works **very slowly** and I do not know why.
