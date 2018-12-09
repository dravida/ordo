"use strict"

// TODO: Requiem Masses (see Ordo)
function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(date2, date1) {
  return(Math.round(date2 - date1)/(24 * 60 * 60 * 1000));
}

// returns the roman numeral for n
function roman_numeral(n) {
  var r = { "M": 1000, "CM": 900, "D": 500, "CD": 400, "C":100, "XC":90,
            "L": 50, "XL":40, "X":10, "IX":9, "V":5, "IV":4, "I":1 };
  var rn = "";
  for (var i in r) {
    while (n >= r[i] ) {
      rn += i;
      n -= r[i];
    }
  }
  return rn;
}

var Kalendar = {
  setup(baseyear) {
    this.k = {};
    var o = Object.create(KalendarYear);
    o.setup(baseyear);
    this.k[baseyear] = o;
  },
  getDate(date) {
    var y = date.getFullYear();
    if(!(y in this.k)) { 
      var o = Object.create(KalendarYear);
      o.setup(y);
      this.k[y] = o;
    }
    var out = this.k[y].getDate(date);
    return(out ? out : "");
  },
  isAbstinence(date) {
    // if Friday and not Christmas or isFast
    return((date.getDay() == 5) && (!(date.getMonth() == 11 && date.getDate() == 25)) || this.isFast(date));
  },
  isFast(date) {
    // Mon, Wed, Fri in Advent
    var dow = date.getDay();
    if(date > KalendarYear.getAdvent(date.getFullYear()) &&
       date < new Date(date.getFullYear(), 11, 25) &&
       (dow == 1 || dow == 3 || dow == 5)) {
      return(true);
    }
    // All days in Lent except Sundays
    if(date >= KalendarYear.getMoveable(date.getFullYear(), "Ash Wednesday") &&
       date <= KalendarYear.getMoveable(date.getFullYear(), "Holy Saturday") &&
       dow != 0) {
      return(true);
    }
    var d = this.getDate(date);
    // Ember days
    if(d.search(/Ember/)) {
      return(true);
    }
    // Vigils
    var d2 = this.getDate(addDays(date, 1)); // need tomorrow too
    var vexpr = "The Vigil of Pentecost|Vigil of the Assumption|Vigil of All Saints|Vigil of the Nativity of the Lord"
    if((d.match(vexpr) && dow != 0) || (d2.match(vexpr) && dow == 6)) {
      return(true);
    }
    return(false);
  }
}

var KalendarYear = {
  setup(year) {
    this.year = year;
    // one element per month
    this.dates = [[], [], [], [], [], [], [], [], [], [], [], []];
    // set up a variable to keep feasts that need translation in order
    this.toTranslate = []; 
    // initialize the calendar
    for (var m in moveable) {
      var d = this.getMoveable(year, m);
      this.addDate2(d, m);
    }
    for (var f in fixed) {
      this.addDate(fixed[f]["m"], fixed[f]["d"], f.trim());
    }
    this.addSundaysAfterEpiphany();
    this.addSundaysAfterTrinity();
    this.addFerias();
    this.addSatOfficeOfBVM();
    this.determinePrecedence();
  },
  addDate(m, d, name) {
    return(this.addAtPosition(m - 1, d - 1, name));
  },
  addDate2(date, name) {
    return(this.addAtPosition(date.getMonth(), date.getDate() - 1, name));
  },
  addAtPosition(mp, dp, name) {
    if(!(dp in this.dates[mp])) {
      var o = Object.create(KalendarDate);
      var r = o.setup(name);
      this.dates[mp][dp] = o;
      return(r);
    } else {
      return(this.dates[mp][dp].push(name));
    }
  },
  getDate(date) {
    if(date.getFullYear() != this.year) { 
      throw new Error("Asking for a date outside this kalendar object's year:" + date); 
    }
    var out = this.dates[date.getMonth()][date.getDate() - 1];
    if(out == undefined) { 
      var o = Object.create(KalendarDate);
      o.setup("");
      this.dates[date.getMonth()][date.getDate() - 1] = o;
      return(o); 
    } else {
      return(out);
    }
  },
  findDate(name) {
    var len = this.dates.length;
    while (len--) {
      var dates = this.dates[len];
      var dateslen = dates.length;
      while (dateslen--) {
        if(dates[dateslen] != undefined && dates[dateslen].search("^" + name + "$")) {
          return(new Date(this.year, len, dateslen + 1));
        }
      }
    }
  },
  getEaster(y) {
    var pfm = ["A5", "M25", "A13", "A2", "M22", 
               "A10", "M30", "A18", "A7", "M27", 
               "A15", "A4", "M24", "A12", "A1", 
               "M21", "A9", "M29", "A17"];
    var a = pfm[y % 19];
    var m = { M: 2, A: 3 };
    a = new Date(y, m[a.charAt(0)], Number(a.slice(1)));
    var b = (diffDays(a, new Date(y, 2, 21)) + 2) % 7;
    var cent = Math.floor(y/100);
    var c = Math.abs(cent - 33) % 7;
    var x = y - cent * 100;
    var d = (x + Math.floor(x/4)) % 7;
    var e = 7 - ((b + c + d) % 7);
    var f = cent - 6 - Math.floor((cent - 12) / 4) + 1;
    return(addDays(a, e + f));
  },
  getMoveable(y, name) {
    var m = moveable[name];
    if("basis" in m) {
      // automatically figure out the right function
      return(addDays(eval("this.get" + m["basis"].substr(0, 1).toUpperCase() + 
                          m["basis"].substr(1))(y), m["diff"]));
    }
  },
  getAdvent(y) {
    var xmas = new Date(y, 11, 25); 
    var xmasdow = xmas.getDay(); // 0 = Sunday
    var weeks;
    if(xmasdow != 0) { weeks = 3; } else { weeks = 4 };
    return(addDays(xmas, 0 - xmasdow - 7 * weeks));
  },
  getTheKing(y) {
    var last_oct = new Date(y, 9, 31);
    return(addDays(last_oct, -last_oct.getDay())); 
  },
  getEmber(y) {
    // First Wednesday after Holy Cross
    var hc = new Date(y, 8, 14);
    var hcdow = hc.getDay();
    if(hcdow < 4) {
      return(addDays(hc, 4 - hcdow)); 
    } else {
      return(addDays(hc, 7 - Math.abs(3 - hcdow)));
    }
  },
  addOctaveSunday(date, octavename) {    
    var odate = addDays(date, 7 - date.getDay());
    if(odate.getFullYear() == this.year) { // necessary because for Nativity Octave may be outside this year
      var odateobj = this.getDate(odate);
      var i = odateobj.removeMatch(/within[\d\D]+octave/i);
      if(i != -1) { // not found - i.e., the Octave Day itself
        var d = this.addDate2(odate, "The Sunday within the Octave of " + octavename);
        d.setValue("class", "Sd2");
      }
    }
  },
  addSunday(date, name, cls) {
    cls = typeof cls !== 'undefined' ? cls : "Sd3"; // default parameter
    var d = this.addDate2(date, name);
    d.setValue("class", cls);
    d.setValue("office", "Sd");
    d.setValue("obligation", "y");
    d.setValue("devotion", "n");
  },
  addSundaysAfterEpiphany() {
    var suffix = " Sunday after the Epiphany"
    var e = new Date(this.year, 0, 6);
    var s = this.getMoveable(this.year, "The Sunday of Septuagesima");
    var n = 0;
    var edow = e.getDay();
    // add first one
    var ei = addDays(e, 7 - edow);
    this.addDate2(ei, "The Holy Family: Mary, Jesus & Joseph");
    this.addSunday(ei, roman_numeral(++n) + suffix, "Sd2");
    var w = Math.floor(diffDays(s, ei) / 7); // How many weeks in Epiphany
    var p = 23 // if 7 or less Sundays in Epiphany can leave this at 23rd Sun
    if(w == 8) {
      p = 22 // if 8 start at the 22nd
    }
    // add the rest
    while(addDays(ei, 7) < s) {
      ei = addDays(ei, 7);
      if(n < 6) {
        this.addSunday(ei, roman_numeral(++n) + suffix);
      } else {
        this.addSunday(ei, roman_numeral(p++) + " Sunday after Pentecost [" + 
                  roman_numeral(p - 2) + " Trinity] (Anticipated) [" + roman_numeral(++n) + " Epiphany]");
      }
    }
  },
  // TODO: there can be 21 weeks in Pentecost in Orthodox Reckoning... what to do there??
  addSundaysAfterTrinity() {
    var t = this.getMoveable(this.year, "The Feast of the Most Holy Trinity");
    var a = this.getMoveable(this.year, "I Sunday in Advent");
    var w = Math.floor(diffDays(a, t) / 7); // How many weeks in Pentecost
    if(w == 22) window.alert(w + " Sundays in Pentecost for " + this.year)
    var nepi = (w - 24); // number of Epiphany Sundays resumed
    var esun = 6 - (w - 25); // which one to start with
    var n = 0;
    var stdadd = function(o, t, n) {  // the usual name to add
      o.addSunday(t, roman_numeral(n + 1) + " Sunday after Pentecost [" + 
                  roman_numeral(n) + " Trinity]");
    };
    var mthadd = function(o, t) {  // add I, II, III... in August, in September, etc.
      if(t.getMonth() == 6 && t.getDate() >= 29 || // on or after July 29th (see p. 424 Monastic Diurnal)
         t.getMonth() > 6 && t.getMonth() < 11) { // August to November,
        var y = t.getFullYear();
        var m = t.getMonth();
        var first_of_current = new Date(y, m, 1);
        var first_of_next = new Date(y, m + 1, 1);
        var days_to_next = diffDays(first_of_next, t);
        var sun_in_month = Math.floor(diffDays(t, first_of_current) / 7) + 1;
        if(days_to_next <= 3) { // anticipated first Sunday
          m = m + 1;
          sun_in_month = 1;
        } else if (first_of_current.getDay() != 0 && 
                   first_of_current.getDay() <= 3) {
          sun_in_month += 1; // will have anticipated first Sunday in previous month
        }
        var d = o.addDate2(t, "(" + roman_numeral(sun_in_month) + " of " + months[m] + ")");
        d.setValue("class", " ");
      }
    };
    while(addDays(t, 7) < a) {
      t = addDays(t, 7);
      ++n;
      if(n < 23) {
        stdadd(this, t, n);
      } else if(nepi > 0) {
        this.addSunday(t, roman_numeral(esun) + " Sunday after Epiphany (Resumed) [" +
                       roman_numeral(n) + " Trinity]");
        --nepi;
        ++esun;
      } else {
        this.addSunday(t, "XXIV and Last Sunday after Pentecost [Sunday Next Before Advent]");
      }
      mthadd(this, t);
    }
    var k = this.addDate2(this.getTheKing(this.year), "The Feast of Our Lord Jesus Christ the King");
    k.setValue("class", "D1");
    k.setValue("obligation", "y");

    // add the Sundays within Octaves of Ascension, Corpus Christi, and the Nativity
    this.addOctaveSunday(
      this.getMoveable(this.year, "The Ascension of Our Lord"), 
      "the Ascension");
    this.addOctaveSunday(
      this.getMoveable(this.year, "The Feast of the Most Holy Body of Christ"), 
      "Corpus Christi");
    this.addOctaveSunday(new Date(this.year, 11, 25), "the Nativity", "DiO3");
    // for this calendar year also check the Octave of the previous Christmas
    this.addOctaveSunday(new Date(this.year - 1, 11, 25), "the Nativity");
  },
  addSatOfficeOfBVM() {
    // find first Saturday of the year
    var nyd = new Date(this.year, 0, 1);
    var sat = addDays(nyd, 6 - nyd.getDay());
    var nye = new Date(this.year, 11, 31);
    while(sat < nye) {
      var topRank = this.getDate(sat).getCelebrations()[0].getValueAsString("class");
      if((!(sat > this.getMoveable(this.year, "The Sunday of Septuagesima") &&
            sat < this.getEaster(this.year))) &&
         (!(sat > this.getAdvent(this.year) &&
          sat < new Date(this.year, 11, 25))) && 
         topRank != "D1" && topRank != "D2" && topRank != "Gd" && topRank != "D" &&
         topRank != "V1" && topRank != "V2" && topRank != "V" &&
         topRank != "F2" && 
         topRank != "OD1" && topRank != "OD2" && topRank != "OD3" && topRank != "ODC" && topRank != "ODS" &&
         topRank != "DiO1" && topRank != "DiO2" && topRank != "DiO3" && topRank != "DiOC") {
        var a = this.addDate2(sat, "Saturday Office of the B.V.M.");
        a.setValue("class", "BVM");
        a.setValue("office", "S");
      }
      sat = addDays(sat, 7);
    }
  },
  addFerias() {
    var start = this.getMoveable(this.year, "The Sunday of Septuagesima");
    var end = this.getMoveable(this.year, "Ash Wednesday");
    var d = start;
    while(d < end) {
      if(d.getDay() != 0) {
        var a = this.addDate2(d, "Commemoration of Septuagesimatide Feria");
        a.setValue("class", "F3");
      }
      d = addDays(d, 1);
    }
    var start = this.getMoveable(this.year, "I Sunday in Advent");
    var end = new Date(this.year, 11, 24);
    var d = start;
    while(d < end) {
      if(d.getDay() != 0 && !this.getDate(d).search(/Ember/)) {
        var a = this.addDate2(d, "Commemoration of Advent Feria");
        a.setValue("class", "F3");
      }
      d = addDays(d, 1);
    }
  },
  removeTranslatedOctaves(o) {
    // if getCelebrations has an octave day in it 
    // of one of the feasts toTranslate then remove it
    var tt = this.toTranslate.map(function(c) { c.getName(); });
    var rm = o.getCelebrations().filter(function(c) { tt.includes(c.getValue("feast")); });
    rm.map(function(c) { o.removeMatch(c.getName()); });
  }, 
  doTranslations(o) {
    // check the class of the first in getCelebrations which is ordered to be highest rank
    var toprank = o.getCelebrations()[0].getValueAsString("class");
    var next2trans = this.toTranslate[0];
    var free = ["D1", "D2", "Sd1", "Sd2", "Sd3", "V1", "F1", "DiO1", "OD2"].
        indexOf(toprank) == -1; // if toprank isn't found here the day is free for a translation...
    if(next2trans != undefined) {
      // ... unless
      if(toprank == "DiO2" && next2trans.getValueAsString("class") == "D2") { free = false; }
      this.removeTranslatedOctaves(o);
      if(free) {
        this.toTranslate.shift();
        o = o.push(next2trans.getName());
        o.setValue("transferred", "y");
      }
    }
  },
  determinePrecedence() {
    // iterate over the entire calendar and sorts out these issues
    var d = new Date(this.year, 0, 1);
    while(d.getFullYear() == this.year) {
      var o = this.getDate(d);
      this.doTranslations(o);
      if(o.getCelebrations().length > 1) {  // don't look unless more than one thing on same day
        var tl = o.needsTranslation();
        if(tl.length > 0) { 
          // save them for later translation
          this.toTranslate.push.apply(this.toTranslate, tl);
          // remove them from their current position
          tl.map(function(s) { o.removeMatch(s.getName()); }, this);
        }
        o.demoteToCommOrNothing();
        // TODO: for parity see if secondary = "y" or if day of obligation/devotion
      }
      d = addDays(d, 1);
    }
  }
};

var KalendarDate = {
  setup(name) {
    this.celes = [];
    return(this.push(name));
  },
  // TODO: rank octaves with each other
  ranksorter(c1, c2) {
    var rank = [ "Sd1", "F1", "V1", "DiO1", "OD2", "D1", "Sd2", "D2", "F2", "DiO2", 
                 "Sd3", "OD3", "ODC",  
                 "V2", "Gd", "iv", "D", 
                 "F2b", // added for Friday after Octave of Ascension
                 "DiO3", "DiOC", "V", "F3", "ODS", "BVM",
                 "Comm", "M", " " ]; // cannot use blank space because has falsity
    var s1 = c1.getValueAsString("class");
    var s2 = c2.getValueAsString("class");
    var class1 = rank.indexOf(s1);
    var class2 = rank.indexOf(s2);
    if(class1 == -1) {
      console.log(s1 + " not found in rank.");
      class1 = 100;
    }
    if(class2 == -1) { 
      console.log(s2 + " not found in rank.");
      class2 = 100;
    }
    return(class1 - class2);
  },
  search(pattern) {
    return(this.celes.some(function(c) { return(c.search(pattern) !== -1); }));
  },
  match(pattern) {
    return(this.celes.some(function(c) { return(c.match(pattern)); }));
  },
  removeMatch(pattern) {
    var i = this.celes.findIndex(function(c) { return(c.getName().search(pattern) !== -1)  });
    if(i != -1) { // not found
      this.celes = this.celes.slice(0, i).concat(this.celes.slice(i + 1));
    }
    return(i);
  },
  valueEqual(valname, value) {
    return(this.celes.some(function(c) { 
      return(c.getValue(valname) == value);
    }));
  },
  push(name) {
    var o = Object.create(KalendarCelebration);
    o.setup(name);
    this.celes.push(o);
    return(o);
  },
  getCelebrations() {
    return(this.celes.sort(this.ranksorter));
  },
  names() {
    return(this.celes.map(function(c) { return(c.getName()); }));
  },
  makeClassTable() {
    // returns class name to count mapping falling on this day
    return(
      this.celes.
        map(function(o) { return(o.getValueAsString("class")); }).
        reduce(
          function(a, c) {
            // if the class has been seen... 
            if(c in a) {
              a[c] += 1;  // add one to current number of times seen
            } else {
              a[c] = 1;   // otherwise initalize it with 1
            }
            return(a);
          }, 
          {} // empty object as initial value
        )
    );
  },
  filterMaker(classes) {
      function filter(o) {
        var cstr = o.getValueAsString("class");
        return(classes.some(function(c) { return(c == cstr); }));
      }
      return(filter);
  },
  lessWorthy(rank) {
    var rankedCeles = this.getCelebrations();
    var s = rankedCeles.filter(this.filterMaker([rank])).
        sort(function(o1, o2) { return(o1.getValueAsString("rank") - 
                                       o2.getValueAsString("rank")); });
    // the s.shift() below removes the highest rank (lowest number) from being
    // transferred/demoted
    // console.log("Preserved " + rank + ": " + s.shift().getName() +
    //            " vs. " + s.map(function(o) { return(o.getName()); }).toString());
    s.shift();
    return(s);
  },
  lessWorthies(classname) {
    var ct = this.makeClassTable();
    if(ct[classname] > 1) {
      return(this.lessWorthy(classname));
    } else {
      return([]);
    }
  },
  demoteAndNothing(demoteIt, nothingIt) {
    var rankedCeles = this.getCelebrations();
    if(demoteIt.length > 0) {
      rankedCeles.
        filter(this.filterMaker(demoteIt)).
        forEach(function(o) { o.demote(); }); 
    }
    if(nothingIt.length > 0) {
      rankedCeles.
        filter(this.filterMaker(nothingIt)).
        forEach(function(o) { o.nothing(); });
    }
  },
  demoteToCommOrNothing() { 
    var topRank = this.getCelebrations()[0].getValueAsString("class");
    switch(topRank) {
      case "D1":
        this.demoteAndNothing(["Sd2", "Sd3", "V2", "ODC", "OD3", "Gd", 
                          "F2", "D", "DiO2", "DiO3", "F2b", "F3"],
                         ["DiOC", "ODS", "V", "M"]);
        break;
      case "D2":
        this.demoteAndNothing(["Sd3", "V2", "ODC", "OD3", "Gd", 
                          "F2", "D", "DiO3", "F2b", "F3", "ODS"],
                         ["DiOC"]);
        break;
      case "Sd1":  case "Sd2": case "Sd3":
      case "V1":   case "V2":
      case "F1":   case "F2":
      case "DiO1": case "OD2":  
        this.demoteAndNothing(["ODC", "Gd", "D", "DiOC", "ODS", "M"], ["V"]);
        break;
      case "ODC":
      case "OD3": 
        this.demoteAndNothing(["Gd"], []);
        this.lessWorthies("ODC").forEach(function(o) { o.demote(); });
        this.lessWorthies("OD3").forEach(function(o) { o.demote(); });
        //fall through
      case "Gd":
        this.lessWorthies("Gd").forEach(function(o) { o.demote(); });
        //fall through
      case "D":
        this.demoteAndNothing(["DiOC", "V", "ODS", "F3", "M"], []);
        this.lessWorthies("D").forEach(function(o) { o.demote(); });
        break;
      case "DiO2":
        this.demoteAndNothing(["ODC", "Gd", "D", "DiOC", "ODS", "V", "M"], []);
        break;
      case "DiO3": case "F2b":
        this.demoteAndNothing(["DiOC", "ODS", "M"], []);
        break;
      case "V":
        this.demoteAndNothing(["ODS"], ["F3"]);
      case "F3": 
        this.demoteAndNothing(["ODS", "M"], []);
        break;
      case "ODS":
        this.demoteAndNothing(["M"], []);
        this.lessWorthies("ODS").forEach(function(o) { o.demote(); });
        break;
      case "BVM":
        this.demoteAndNothing(["M"], []);
        break;
    }
  },
  needsTranslation() {
    var rankedCeles = this.getCelebrations();
    var topRank = rankedCeles[0].getValueAsString("class");
    var toTranslate = [];
    switch(topRank) {
      case "Sd1":
      case "F1":
      case "V1":
      case "DiO1":
      case "OD2":
        toTranslate = rankedCeles.filter(this.filterMaker(["D1", "D2"]));
        break;
      case "Sd2":
      case "DiO2":
      case "D1":
        toTranslate = rankedCeles.filter(this.filterMaker(["D2"]));  
        this.lessWorthies("D1").forEach(function(o) { toTranslate.push(o); });
        break;
      case "D2":
        this.lessWorthies("D2").forEach(function(o) { toTranslate.push(o); });
        break;
    }
    return(toTranslate);
  }
};

var KalendarCelebration = {
  setup(name) {
    this.cele = { "name": name };
  },
  getName() {
    return(this.cele["name"]);
  },
  getValue(valname) {
    var name = this.getName();
    // first see if we overrode the default
    if(this.cele[valname]) {  
      return(this.cele[valname]);
    } else if(!(name in meta) && 
              Object.keys(this.cele).length > 1) { // nothing in meta but is internally defined
      return(undefined);
    } else {
      if(meta[name] == undefined) {
        alert("Unexpected error - please e-mail us with following information: \"" +
              valname + " for " + name + "\" is undefined - and we'll take care of it as soon as possible.\nPress OK to continue.");
        return(undefined); 
      }
      return(meta[name][valname]);
    }
  },
  setValue(valname, value) {
    this.cele[valname] = value;
  },
  getOffice() {
    var o = this.getValueAsString("office");
    if(o == "") {
      return(this.getValueAsString("class"));
    } else {
      return(o);
    }
  },
  getValueAsString(valname) {
    var o = this.getValue(valname);
    return(o == undefined ? "" : o); 
  },
  search(pattern) {
    return(this.getName().search(pattern));
  },
  match(pattern) {
    return(this.getName().match(pattern));
  },
  isObligation() {
    return(this.getValue("obligation") == "y");
  },
  isDevotion() {
    return(this.getValue("devotion") == "y");
  },
  demote() { 
    this.setValue("class", "Comm"); 
  },
  nothing() { 
    this.setValue("nothing", "y"); 
  }
};
