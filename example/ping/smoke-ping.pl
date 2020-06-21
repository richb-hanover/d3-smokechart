use v5.18;
use warnings;
use strict;

use Net::Ping;
use Data::Dumper;


my $p = Net::Ping->new("tcp");


sub runTest {
    my $target = shift || "gooogle.com"; 
    my @reslt = ();
    for (0..5) {
        my ($ret, $duration, $ip) = $p->ping($target, 5.5);
        if ($ret) {
            push @reslt, int($duration*1000);
        }
    }
    return "[". join(",", sort(@reslt)). "]";
}


my $arg = shift @ARGV;

$p->hires();
$p->port_number(scalar(getservbyname("http", "tcp")));
for (0..20) {
    print runTest($arg), ", " for 1..5;
    print "\n";
}
$p->close();




