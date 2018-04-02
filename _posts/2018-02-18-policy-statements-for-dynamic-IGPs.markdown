---
layout: post
title:  "Policy Statments for dynamic IGPs"
date:   2018-02-18 00:16:00 -0500
comments: true
tags:
  - juniper
---

<h2>Policy Statements for dynamic IGPs</h2>

I thought about writing about this policy-statement I came across the other day:

```
term 10 {
    from {
        protocol [ static direct ];
        route-filter 10.50.0.0/16 orlonger;
    }
    then accept;
}
term 100 {
    then reject;
}
```

This policy statement is used to export (inject) routes into IS-IS. The key thing to remember here is the route filter applies to anything in the routing table that comes from static or direct routes:

```
jromero@mx-480> show route protocol static

And

jromero@mx-480> show route protocol direct

```

Keep in mind that if you match `exact` prefixes in your route-filter then your routing table should have an active aggregate route:

```
jromero@mx-480> show route protocol aggregate

```
