# Run Skip Play

## OSC Message specifications

OSC Bridge will send out these messages on port 57120

### /Player

For each active player, one message 13 arguments

```
/player

0:id
1:rotationRateX
2:rotationRateY
3:rotationRateZ
4:acclerationX
5:acclerationY
6:acclerationZ
7:orientationX
8:orientationY
9:orientationZ
10:tap_count
11:tap_rate
12:zone 
```

### /Zone

For each zone, one message per zone, with 14 arguments, these are the totals for all players in the zone
```
/zone

0:id
1:rotationRateX
2:rotationRateY
3:rotationRateZ
4:acclerationX
5:acclerationY
6:acclerationZ
7:orientationX
8:orientationY
9:orientationZ
10:tap_count
11:tap_rate
12:clients
13:accelerationMagnitude
```
