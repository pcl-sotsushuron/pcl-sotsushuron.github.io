/* 卒修論発表会サイトの小さな動き（外部ライブラリなし。JSが無くても全部読める）
 * 1. 当日だけ、時間割の「いまここ」と冒頭の「いまは〜」を出す（?now=2027-01-23T11:20 で試せる）
 * 2. 発表一覧の絞り込み
 */
(function () {
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function mins(t) { if (!t) return null; var p = t.split(':'); return +p[0] * 60 + +p[1]; }

  var now = new Date();
  var m = /[?&]now=([0-9-]+)T([0-9]{1,2}):([0-9]{2})/.exec(location.search);
  var today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  var cur = now.getHours() * 60 + now.getMinutes();
  if (m) { today = m[1]; cur = +m[2] * 60 + +m[3]; }

  var day = document.body.getAttribute('data-event-date');
  if (day && day === today) {
    var label = null, next = null;
    var lists = document.querySelectorAll('.timetable');
    for (var k = 0; k < lists.length; k++) {
      var items = lists[k].querySelectorAll('li');
      for (var i = 0; i < items.length; i++) {
        var li = items[i], s = mins(li.getAttribute('data-start')), e = mins(li.getAttribute('data-end'));
        if (s === null) continue;
        if (e === null) e = s + 1;
        if (cur >= s && cur < e) { li.className += ' is-now'; if (!label) label = li; }
        else if (cur >= e) li.className += ' is-past';
        else if (!next) next = li;
      }
    }
    var box = document.getElementById('now');
    if (box) {
      var text = function (li) { return li.querySelector('.what').firstChild.textContent; };
      if (label) box.textContent = 'いまは「' + text(label) + '」（' + label.getAttribute('data-end') + 'まで）' + (next ? '　次は ' + next.getAttribute('data-start') + '〜「' + text(next) + '」' : '');
      else if (next) box.textContent = '次は ' + next.getAttribute('data-start') + '〜「' + text(next) + '」';
      else box.textContent = '本日のプログラムは終了しました。ご参加ありがとうございました。';
      box.hidden = false;
    }
  }

  var q = document.getElementById('q');
  if (q) {
    var rows = document.querySelectorAll('.plist tbody tr');
    var secs = document.querySelectorAll('.session');
    var hits = document.getElementById('hits');
    var run = function () {
      var words = q.value.toLowerCase().split(/[\s　]+/).filter(Boolean), n = 0;
      for (var i = 0; i < rows.length; i++) {
        var t = rows[i].getAttribute('data-q'), ok = true;
        for (var j = 0; j < words.length; j++) if (t.indexOf(words[j]) < 0) { ok = false; break; }
        rows[i].hidden = !ok; if (ok) n++;
      }
      for (var s = 0; s < secs.length; s++) {
        var vis = secs[s].querySelectorAll('tbody tr:not([hidden])').length;
        secs[s].className = secs[s].className.replace(/\s*is-empty/, '') + (vis ? '' : ' is-empty');
      }
      hits.textContent = words.length ? n + '件' : '';
    };
    q.addEventListener('input', run);
  }
})();
