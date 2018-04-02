---
layout: post
title:  "Troubleshooting Network Slowness"
date:   2018-04-01 00:18:30 -0500
comments: true
tags:
  - other
new: new
---

<h2>Troubleshooting Network Slowness</h2>

<h3>First, let's go over some basics:</h3>

Bandwidth vs Throughput

Bandwidth = How wide your channel is. Maximum amount of data that can travel through a channel.
Throughput = How much data actually travels through the channel successfully. This can be limited by tons of different things.

<h3>Things that may affect throughput:</h3>

- Latency
- Packet loss
- Network Congestion
- Small TCP Receive Windows
- Traffic shaping and Rate limiting

Maximum Transmission Units (MTU) in ethernet frames are by default 1500 bytes. There's also a maximum segment size that's agreed upon a session, looks something like this:

![MTU-image]({{ site.baseurl }}/images/MTU-image-1.png "MTU")

**Path MTU Discovery** can be used to discover the maximum MTU size along the path of a TCP connection. You can use ping or tracepath (linux tool) to discover this MTU. Useful when implementing Jumbo Frames (Larger MTUs usually 9000 bytes). MTUs larger than the default should be supported along the path.

<h3> Long Fat Networks (LFN): </h3>

**High Bandwidth, High Delay**. The idea behind this is you have a maximum (outstanding) amount of data on the wire on the way to the destination, while the sender is sitting idle waiting for acknowledgements for the data sent. This stop and wait is a waste of bandwidth, since the link is not being fully utilized.

There's a concept of **Bandwidth Delay Product (BDP)**, which is basically how much outstanding data (not acknowledged) you can ever have on the wire for a given time assuming perfect network conditions. If your Receive Window is smaller than your BDP (often the case with LFNs) then you waste precious bandwidth. The ideal case should be TCP windows fully opening to what the BDP is for that link.

BDP is calculated by taking the maximum data link capacity and multiplying it by the round trip delay **(BxD)**, the results can be given in bits or bytes. LFN have high Bandwidth Delay Products because the amount of outstanding data on the wire lasts for longer time than those with lower BDPs. Therefore, TCP receive windows (max allowed unacknowledged data) negotiated at the beginning of sessions are stressed more often than those lighter not so fat networks. Remember: BDPs for a given link are assuming perfect network conditions.

As a solution to increasing throughput on LFNs, you either increase the TCP receive windows past 65K or lower the delay RTT. Window scaling was created for this reason (rfc7323).

However, here is where **Congestion Control** comes in and **Congestion Windows**. Even if your windows are large enough on the receiver side but your network conditions are not ideal (Congestion, Packet loss etc) your congestion window (which is dynamically adjusted by the protocol) will never fully open, causing you to get much lower throughput.

Here are two pictures showing what congestion windows look like during a TCP session:

![CWND-image]({{ site.baseurl }}/images/cwnd-and-rwnd-glossary.gif "cwn-and-rwnd")

![CWND-image-2]({{ site.baseurl }}/images/cwnd-1024x203.png "CWND")

<h3> Things to keep in mind </h3>

- Congestion Windows are dynamically adjusted throughout the session and are greatly affected/limited by how well and healthy the condition of the network is. (Read more on TCP slow start, Slow Start Thresholds for more detail on congestion control)

- Receive Windows are dynamically adjusted throughout session, with every ack the sender gets an updated window size, in a healthy network, the congestion window will quickly grow to the maximum window size negotiated. Limitations being max receive window sizes hard set at a number with no window scaling or application not picking up data fast enough from receive buffer. In any case, **the sender is always bound by the cwnd**.

<h3> Finding root cause </h3>

Use IPERF3 (leaner code base than iperf2) to test your throughput and see what your CWND looks like.

Perform tcpdumps while your iperf3 tests are running (Make sure to start your captures before firing your iperf test to capture 3 way handshake so you get proper window sizes negotiated at the beginning of session).

Load pcap caputure into wireshark and create IO graphs using the following filters (inspired by this [blog](https://notalwaysthenetwork.com/2014/04/09/troubleshooting-with-wireshark-io-graphs-part-1/) post):

- **tcp.analysis.lost_segment** – Indicates we’ve seen a gap in sequence numbers in the capture.  Packet loss can lead to duplicate ACKs, which leads to retransmissions

- **tcp.analysis.duplicate_ack** – displays packets that were acknowledged more than one time.  A high number of duplicate ACKs is a sign of possible high latency between TCP endpoints

- **tcp.analysis.retransmission** – Displays all retransmissions in the capture.  A few retransmissions are OK, excessive retransmissions are bad. This usually shows up as slow application performance and/or packet loss to the user

- **tcp.analysis.window_update** – this will graph the size of the TCP window throughout your transfer.  If you see this window size drop down to zero(or near zero) during your transfer it means the sender has backed off and is waiting for the receiver to acknowledge all of the data already sent.  This would indicate the receiving end is overwhelmed.

- **tcp.analysis.bytes_in_flight** – the number of unacknowledged bytes on the wire at a point in time.  The number of unacknowledged bytes should never exceed your TCP window size (defined in the initial 3 way TCP handshake) and to maximize your throughput you want to get as close as possible to the TCP window size.  If you see a number consistently lower than your TCP window size, it could indicate packet loss or some other issue along the path preventing you from maximizing throughput.

- **tcp.analysis.ack_rtt** – measures the time delta between capturing a TCP packet and the corresponding ACK for that packet. If this time is long it could indicate some type of delay in the network (packet loss, congestion, etc)

Surprise surprise ;)
