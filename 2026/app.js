/* 卒修論発表会サイトの小さな動き（外部ライブラリなし。JSが無くても全部読める）
 * 1. 当日だけ、時間割の「いまここ」と冒頭の「いまは〜」を出す（?now=2027-01-23T11:20 で試せる）
 * 2. 発表一覧の絞り込み
 * 3. 冒頭のカウントダウン（開催前→開催中→終了。?now=2027-01-23T11:20 で試せる）
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

  // 3. 開催までのカウントダウン（開始・終了は body の data-event-start / data-event-end。?now= は日本時間として扱う）
  var cd = document.getElementById('countdown');
  var t0 = Date.parse(document.body.getAttribute('data-event-start') || '');
  var t1 = Date.parse(document.body.getAttribute('data-event-end') || '');
  if (cd && !isNaN(t0) && !isNaN(t1)) {
    var shift = 0;
    var mm = /[?&]now=([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?/.exec(location.search);
    if (mm) {
      var fake = Date.parse(mm[1] + 'T' + pad(+mm[2]) + ':' + mm[3] + ':' + (mm[4] || '00') + '+09:00');
      if (!isNaN(fake)) shift = fake - Date.now();
    }
    var cdLabel = cd.querySelector('.cd-label'), cdBody = cd.querySelector('.cd-body');
    var when = (cd.querySelector('.cd-static') || cdBody).textContent;
    var unit = function (n, u) { return '<span class="cd-n">' + n + '</span><span class="cd-u">' + u + '</span>'; };
    var state = '', timer = null;
    var tick = function () {
      var t = Date.now() + shift, st = t < t0 ? 'before' : (t < t1 ? 'during' : 'after');
      if (st === 'before') {
        var s = Math.floor((t0 - t) / 1000);
        var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60;
        cdBody.innerHTML = unit(d, '日') + unit(pad(h), '時間') + unit(pad(mi), '分') + unit(pad(se), '秒');
      }
      if (st === state) return;
      state = st;
      cd.className = 'countdown is-' + st;
      if (st === 'before') cdLabel.textContent = '開催まであと';
      else if (st === 'during') { cdLabel.textContent = when; cdBody.innerHTML = '<span class="cd-msg">ただいま開催中</span>'; }
      else { cdLabel.textContent = when; cdBody.innerHTML = '<span class="cd-msg">本年度の発表会は終了しました</span>'; if (timer) clearInterval(timer); }
    };
    tick();
    if (state !== 'after') timer = setInterval(tick, 1000);
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

  // 4. スケジュールの線に「今日」を出す（?now=2026-12-01T09:00 で試せる）
  var sc = document.querySelector('.sched');
  if (sc) {
    var d0 = Date.parse(sc.getAttribute('data-start') + 'T00:00:00+09:00'), d1 = Date.parse(sc.getAttribute('data-end') + 'T00:00:00+09:00');
    var tn = Date.now(), qq = /[?&]now=([0-9]{4}-[0-9]{2}-[0-9]{2})/.exec(location.search);
    if (qq) tn = Date.parse(qq[1] + 'T12:00:00+09:00');
    var jst = new Date(tn + 9 * 3600000), dayStart = Date.parse(jst.toISOString().slice(0, 10) + 'T00:00:00+09:00');
    if (!isNaN(d0) && !isNaN(d1) && dayStart >= d0 && dayStart <= d1) {
      var pc = (dayStart - d0) / (d1 - d0) * 100;
      var td = sc.querySelector('.sched-today');
      td.style.setProperty('--t', pc.toFixed(1));
      td.querySelector('.tag').textContent = '今日 ' + (jst.getUTCMonth() + 1) + '月' + jst.getUTCDate() + '日';
      td.hidden = false;
      var past = sc.querySelector('.sched-past');
      if (window.matchMedia('(max-width: 640px)').matches) past.style.height = pc.toFixed(1) + '%'; else past.style.width = pc.toFixed(1) + '%';
      window.matchMedia('(max-width: 640px)').addEventListener('change', function (e) { past.style.width = e.matches ? '' : pc.toFixed(1) + '%'; past.style.height = e.matches ? pc.toFixed(1) + '%' : ''; });
    }
  }
})();
