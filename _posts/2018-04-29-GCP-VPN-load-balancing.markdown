---
layout: post
title:  "Google Cloud Platform VPN load balancing"
date:   2018-04-29 00:19:55 -0500
comments: true
tags:
  - other
new: new
---

<h2>Google Cloud Platform VPN Load balancing</h2>

Recently I worked on a project to build and design a fault-tolerant network with multiple VPNs load balancing traffic in order to increase the aggregate vpn throughput from HQ to a virtual private cloud (VPC) network.

Cloud VPNs at GCP support up to a maximum of 1.5Gbps per tunnel over public internet. One of the solutions to increase VPN throughput is to set up multiple tunnels forwarding the same IP range at different IPs on your on-premise (HQ) VPN gateway. This will cause the cloud VPN gateway to automatically load balance between the configured tunnels.

**Note:** This example assumes your on-premise VPN gateway's throughput capabilities are supported.  

Our topology will look like this:

![GCP-tunnels]({{ site.baseurl }}/images/GCP-Tunnels.jpg "GCP Tunnels")

- Total of 6 tunnels (3 in East1 region and 3 in East4) split between two cloud VPN Gateways.
- Each of those tunnels will terminate in three different providers at our HQ SRX Cluster. In the event one goes down, there will be 2 other tunnels per region.
- Cloud VPNs at GCP use ECMP (equal cost multi-path) to load balance traffic, we will use the same in our SRX cluster.
- There will be two GCP network-tags that will be applied to our instances in East-1 and East-4 so they are properly routed out their corresponding VPN gateways forcing traffic to stay local to a given region.

<h3> Configuring Tunnels, Routes and Network Tags </h3>

We will start by having two VPN gateways, one in East-1 and another in East-4. Once we do that, we build our six tunnels forwarding the same subnet (in our case 10.0.0.0/8) to our three different peer IPs (provider-1, provider-2 and provider-3).

In the end it should look like this:

![tunnels]({{ site.baseurl }}/images/Tunnels.jpg "tunnels")

Now let's create our VPC routes, we will forward 10.0.0.0/8 with our next-hop being the tunnels we created. We will also apply these routes to any instance that have the network-tags `routes-us-east1` and `routes-us-east4` this is so VPN traffic for east1 and east4 egress through their corresponding cloud VPN gateways local to their region. A note about the routes above, since we use three routes per region pointing to our tunnels, this could probably have been done with a single route. However, I was not able to confirm if load balancing will take place by pointing it to a single tunnel as my next-hop.

Our routes should look like this:

![routes]({{ site.baseurl }}/images/routes.jpg "routes")

<h3> Configuring our SRX </h3>

As mentioned earlier, since we have multiple next-hop addresses (our tunnel interfaces) for the same destination (east1 and east4) with equal cost, Equal-cost multipath (ECMP) is a perfect candidate to use for this particular scenario.

After configuring our VPN tunnels, we should've ended up with the following tunnel interfaces: `st0.40, st0.41, st0.42, st0.43, st0.44 and st0.45`

We then add the following static routes:

```
[edit routing-options static]
+    route 10.142.0.0/20 next-hop [ st0.40 st0.41 st0.42 ];
+    route 10.150.0.0/20 next-hop [ st0.43 st0.44 st0.45 ];
```

Configure ECMP for our GCP routes:

```
[edit routing-options]
+   forwarding-table {
+       export GCP-load-balancing-policy;
+   }
[edit policy-options]
+   policy-statement GCP-load-balancing-policy {
+       from {
+           route-filter 10.142.0.0/20 orlonger;
+           route-filter 10.150.0.0/20 orlonger;
+       }
+       then {
+           load-balance per-packet;
+       }
+   }
```

Commit your configuration, configure your instances to use the network tags set up and traffic should start to load balance nicely across all your tunnels, here's a snapshot of our network graphs:

![dash]({{ site.baseurl }}/images/grafana-dash.jpg "dash")
