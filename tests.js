import Kalendar from './kalendar.js';
import Kalendar_old from './kalendar_old.js';
import {addDay} from './date_calcs.js';
import {getDayLetter, getSundayLetter, getEpact, formatRank} from './publish_columns.js';

QUnit.test("Match new vs. old", function( assert ) {
  function testYear(year) {
    var d = new Date(year, 0, 1);
    var y = d.getFullYear();
    var o = new Kalendar_old(y); 
    var n = new Kalendar(y); 
    while(d.getFullYear() == y) {
      var oc = o.getDate(d).getCelebrations();
      var nc = n.getDate(d).getCelebrations();
      assert.deepEqual(nc.map(c => c.name), oc.map(c => c.name), d);
      d = addDay(d);
    }
  }
  [2017, 2018, 2019, 2020, 2021, 2022].map(testYear);
});
QUnit.test("Advent", function( assert ) {
  function testAdvent(y, m, d) {
    var e = Kalendar.getAdvent(y);
    assert.equal(e.getMonth(), m - 1);
    assert.equal(e.getDate(), d);
  }
  testAdvent(2015, 11, 29);
  testAdvent(2016, 11, 27);
  testAdvent(2017, 12, 3);
  testAdvent(2018, 12, 2);
  testAdvent(2019, 12, 1);
  testAdvent(2020, 11, 29);
  testAdvent(2021, 11, 28);
  testAdvent(2022, 11, 27);
  testAdvent(2023, 12, 3);
});

QUnit.test("Eastern Easter", function( assert ) {
  function testEaster(y, m, d) {
    var e = Kalendar.getEaster(y);
    assert.equal(e.getMonth(), m - 1);
    assert.equal(e.getDate(), d);
  }
  testEaster(2015, 4, 12);
  testEaster(2016, 5, 1);
  testEaster(2017, 4, 16);
  testEaster(2018, 4, 8);
  testEaster(2019, 4, 28);
  testEaster(2020, 4, 19);
  testEaster(2021, 5, 2);
  testEaster(2022, 4, 24);
  testEaster(2023, 4, 16);
});
QUnit.test("Number of weeks in Pentecost", function( assert ) {
  function testNWP(y, n) {
    assert.equal(Kalendar.sundaysInPentecost(y), n)
  }
  testNWP(2015, 25);
  testNWP(2016, 22);
  testNWP(2017, 25);
  testNWP(2018, 26);
  testNWP(2019, 23);  
  testNWP(2020, 24);  
  testNWP(2021, 22);  
  testNWP(2022, 23);  
  testNWP(2023, 25);  
});
QUnit.test("Number of weeks in Epiphany", function( assert ) {
  function testNWE(y, n) {
    assert.equal(Kalendar.sundaysInEpiphany(y), n)
  }
  testNWE(2015, 4);
  testNWE(2016, 7);
  testNWE(2017, 5);
  testNWE(2018, 4);
  testNWE(2019, 6);  
  testNWE(2020, 5);  
  testNWE(2021, 7);  
  testNWE(2022, 6);  
  testNWE(2023, 5);  
});

QUnit.test("Publish: Day Letter (perpetual, A always capitalized)", function( assert ) {
  assert.equal(getDayLetter(1, 1), "A", "Jan 1 = A");
  assert.equal(getDayLetter(1, 8), "A", "Jan 8 = A (7-day cycle)");
  assert.equal(getDayLetter(1, 3), "c", "Jan 3 = c (lowercase)");
  assert.equal(getDayLetter(2, 1), "d", "Feb 1 = d");
  assert.equal(getDayLetter(2, 2), "e", "Feb 2 = e");
});
QUnit.test("Publish: true Sunday (dominical) letter", function( assert ) {
  assert.equal(getSundayLetter(2027), "C");
  assert.equal(getSundayLetter(2026), "D");
  assert.equal(getSundayLetter(2025), "E");
});
QUnit.test("Publish: Rank with octave suffix", function( assert ) {
  assert.equal(formatRank({office: "D1", octave: "2"}), "D1, O2", "Epiphany-style");
  assert.equal(formatRank({office: "D2", octave: "N"}), "D2", "no octave");
  assert.equal(formatRank({office: "Gd", octave: "C"}), "Gd, OC", "common octave");
});
QUnit.test("Publish: Epact lookup", function( assert ) {
  var table = {"1": {"1": "*", "6": "25 xxv", "30": "i"}};
  assert.equal(getEpact(table, 1, 1), "*");
  assert.equal(getEpact(table, 1, 6), "25 xxv");
  assert.equal(getEpact(table, 1, 30), "i");
  assert.equal(getEpact(table, 1, 2), "", "missing entry -> empty string");
});
