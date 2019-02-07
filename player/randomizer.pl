#!/usr/bin/perl

use strict;
use warnings;
use CGI;

BEGIN {
	my $cgi = CGI->new;
	print $cgi->header(-type => 'text');
}

my $dir = '../songs/';
opendir(DIR, $dir) or die $!;

print '[';

while (my $file = readdir(DIR)) {
	# Use a regular expression to ignore files beginning with a period
	next if ($file =~ m/^\./);
	
	print qq{
	{
		"title": "$file",
		"file": "../songs/$file",
		"howl": "null"
	},};
}

print qq{
	{
		"title": "MISSIO - Bottom Of The Deep Blue Sea [Lyrics].mp3",
		"file": "../songs/MISSIO - Bottom Of The Deep Blue Sea [Lyrics].mp3",
		"howl": null
	}
};

print ']';

closedir(DIR);