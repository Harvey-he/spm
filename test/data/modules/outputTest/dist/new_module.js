define("test/outputTest/0.0.1/a",[],function(a,b){b.getA=function(){}}),define("test/outputTest/0.0.1/b",[],function(a,b){b.getB=function(){}}),define("test/outputTest/0.0.1/a",[],function(a,b){b.getA=function(){}}),define("test/outputTest/0.0.1/b",[],function(a,b){b.getB=function(){}}),define("test/outputTest/0.0.1/c",[],function(a,b){b.getC=function(){}}),define("test/outputTest/0.0.1/plugins/p1",[],function(){}),define("test/outputTest/0.0.1/allMerge",["./a","./b","./c","./plugins/p1","./plugins/p2","gallery/jquery/1.7.2/jquery","arale/widget/1.0.2/widget","arale/base/1.0.1/base","arale/class/1.0.0/class","arale/events/1.0.0/events"],function(a,b){var c=a("gallery/jquery/1.7.2/jquery"),d=a("arale/widget/1.0.2/widget");a("./a"),a("./b"),a("./c"),a("./plugins/p1"),a("./plugins/p2"),b.get=function(a){var b=c(a);d.render(b,module)}}),define("test/outputTest/0.0.1/c",[],function(a,b){b.getC=function(){}});