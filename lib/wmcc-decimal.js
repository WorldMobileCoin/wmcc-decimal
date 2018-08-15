/*!
 * Copyright (c) 2018, Park Alter (pseudonym)
 * Distributed under the MIT software license, see the accompanying
 * file COPYING or http://www.opensource.org/licenses/mit-license.php
 *
 * https://github.com/worldmobilecoin/wmcc-decimal
 * wmcc-decimal.js - decimal for wmcc-exchange.
 */

'use strict';

const assert = require('assert');

class Decimal {
  constructor(dec) {
    if (dec instanceof Decimal) {
      this.s = dec.s;
      this.e = dec.e;
      //this.d = dec.d || 1;
      this.c = dec.c.slice();
    } else {
      parse(this, dec);
    }
  }

  cmp(y) {
    let isneg,
        x = this,
        xc = x.c,
        yc = (y = new Decimal(y)).c,
        i = x.s,
        j = y.s,
        k = x.e,
        l = y.e;

    if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;
    if (i != j) return i;
    isneg = i < 0;
    if (k != l) return k > l ^ isneg ? 1 : -1;
    j = (k = xc.length) < (l = yc.length) ? k : l;
    for (i = -1; ++i < j;)
      if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
    return k == l ? 0 : k > l ^ isneg ? 1 : -1;
  }

  abs() {
    let y = new Decimal(this);
    y.s = 1;
    return y;
  }

  add(y) {
    let t,
        x = this,
        a = x.s,
        b = (y = new Decimal(y)).s;

    if (a != b) {
      y.s = -b;
      return x.minus(y);
    }

    let xe = x.e,
        xc = x.c,
        ye = y.e,
        yc = y.c;

    if (!xc[0] || !yc[0]) return yc[0] ? y : new Decimal(xc[0] ? x : a * 0);
    xc = xc.slice();
    if (a = xe - ye) {
      if (a > 0) {
        ye = xe;
        t = yc;
      } else {
        a = -a;
        t = xc;
      }
      t.reverse();
      for (; a--;) t.push(0);
      t.reverse();
    }
    if (xc.length - yc.length < 0) {
      t = yc;
      yc = xc;
      xc = t;
    }
    a = yc.length;
    for (b = 0; a; xc[a] %= 10) b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;
    if (b) {
      xc.unshift(b);
      ++ye;
    }
    for (a = xc.length; xc[--a] === 0;) xc.pop();
    y.c = xc;
    y.e = ye;
    return y;
  }

  sub(y) {
    let i, j, t, xlty,
        x = this,
        a = x.s,
        b = (y = new Decimal(y)).s;

    if (a != b) {
      y.s = -b;
      return x.plus(y);
    }

    let xc = x.c.slice(),
        xe = x.e,
        yc = y.c,
        ye = y.e;

    if (!xc[0] || !yc[0])
      return yc[0] ? (y.s = -b, y) : new Decimal(xc[0] ? x : 0);

    if (a = xe - ye) {
      if (xlty = a < 0) {
        a = -a;
        t = xc;
      } else {
        ye = xe;
        t = yc;
      }
      t.reverse();
      for (b = a; b--;) t.push(0);
      t.reverse();
    } else {
      j = ((xlty = xc.length < yc.length) ? xc : yc).length;
      for (a = b = 0; b < j; b++) {
        if (xc[b] != yc[b]) {
          xlty = xc[b] < yc[b];
          break;
        }
      }
    }
    if (xlty) {
      t = xc;
      xc = yc;
      yc = t;
      y.s = -y.s;
    }
    if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;
    for (b = i; j > a;) {
      if (xc[--j] < yc[j]) {
        for (i = j; i && !xc[--i];) xc[i] = 9;
        --xc[i];
        xc[j] += 10;
      }
      xc[j] -= yc[j];
    }
    for (; xc[--b] === 0;) xc.pop();
    for (; xc[0] === 0;) {
      xc.shift();
      --ye;
    }
    if (!xc[0]) {
      y.s = 1;
      xc = [ye = 0];
    }
    y.c = xc;
    y.e = ye;
    return y;
  }

  mul(y) {
    let c,
        x = this,
        xc = x.c,
        yc = (y = new Decimal(y)).c,
        a = xc.length,
        b = yc.length,
        i = x.e,
        j = y.e;

    y.s = x.s == y.s ? 1 : -1;
    if (!xc[0] || !yc[0]) return new Decimal(y.s * 0);
    y.e = i + j;
    if (a < b) {
      c = xc;
      xc = yc;
      yc = c;
      j = a;
      a = b;
      b = j;
    }
    for (c = new Array(j = a + b); j--;) c[j] = 0;
    for (i = b; i--;) {
      b = 0;
      for (j = a + i; j > i;) {
        b = c[j] + yc[i] * xc[j - i - 1] + b;
        c[j--] = b % 10;
        b = b / 10 | 0;
      }
      c[j] = (c[j] + b) % 10;
    }
    if (b) ++y.e;
    else c.shift();
    for (i = c.length; !c[--i];) c.pop();
    y.c = c;
    return y;
  }

  div(y) {
    let x = this,
        a = x.c,
        b = (y = new Decimal(y)).c,
        k = x.s == y.s ? 1 : -1,
        dp = Decimal.DP;

    if (dp !== ~~dp || dp < 0 || dp > Decimal.MAX_DP) throw Error('Invalid decimal point.');
    if (!b[0]) throw Error('Division by zero.');
    if (!a[0]) return new Decimal(k * 0);

    let bl, bt, n, cmp, ri,
        bz = b.slice(),
        ai = bl = b.length,
        al = a.length,
        r = a.slice(0, bl),
        rl = r.length,
        q = y,
        qc = q.c = [],
        qi = 0,
        d = dp + (q.e = x.e - y.e) + 1;
    q.s = k;
    k = d < 0 ? 0 : d;
    bz.unshift(0);
    for (; rl++ < bl;) r.push(0);
    do {
      for (n = 0; n < 10; n++) {
        if (bl != (rl = r.length)) {
          cmp = bl > rl ? 1 : -1;
        } else {
          for (ri = -1, cmp = 0; ++ri < bl;) {
            if (b[ri] != r[ri]) {
              cmp = b[ri] > r[ri] ? 1 : -1;
              break;
            }
          }
        }
        if (cmp < 0) {
          for (bt = rl == bl ? b : bz; rl;) {
            if (r[--rl] < bt[rl]) {
              ri = rl;
              for (; ri && !r[--ri];) r[ri] = 9;
              --r[ri];
              r[rl] += 10;
            }
            r[rl] -= bt[rl];
          }
          for (; !r[0];) r.shift();
        } else {
          break;
        }
      }
      qc[qi++] = cmp ? n : ++n;
      if (r[0] && cmp) r[rl] = a[ai] || 0;
      else r = [a[ai]];
    } while ((ai++ < al || r[0] !== Decimal.UNDEFINED) && k--);
    if (!qc[0] && qi != 1) {
      qc.shift();
      q.e--;
    }
    if (qi > d) round(q, dp, Decimal.RM, r[0] !== Decimal.UNDEFINED);
    return q;
  }

  pow(n) {
    let x = this,
        one = new Decimal(1),
        y = one,
        isneg = n < 0;

    if (n !== ~~n || n < -Decimal.MAX_POW || n > Decimal.MAX_POW) throw Error('Invalid exponent.');
    if (isneg) n = -n;

    for (;;) {
      if (n & 1) y = y.mul(x);
      n >>= 1;
      if (!n) break;
      x = x.mul(x);
    }

    return isneg ? one.div(y) : y;
  }

  mod(y) {
    let ygtx,
        x = this,
        a = x.s,
        b = (y = new Decimal(y)).s;

    if (!y.c[0]) throw Error('Division by zero.');

    x.s = y.s = 1;
    ygtx = y.cmp(x) == 1;
    x.s = a;
    y.s = b;

    if (ygtx) return new Decimal(x);

    a = Decimal.DP;
    b = Decimal.RM;
    Decimal.DP = Decimal.RM = 0;
    x = x.div(y);
    Decimal.DP = a;
    Decimal.RM = b;

    return this.sub(x.mul(y));
  }

  divmod(y) {
    let x = this,
        b = (y = new Decimal(y)),
        qd = x.div(b),
        qe = qd.e,
        q = round(qd, qe, 0),
        r = x.mod(b);
    return [q, r];
  }

  rescale(d) {
    const x = this.toExponential(d),
          y = new Decimal(x);
    return y;
  }

  toExponential(dp) {
    return stringify(this, 1, dp, dp);
  }

  toFixed(dp) {
    return stringify(this, 2, dp, this.e + dp);
  }

  toPrecision(sd) {
    return stringify(this, 3, sd, sd - 1);
  }

  valueOf() {
    return stringify(this, 4);
  }

  toJSON() {
    return this.valueOf();
  }

  toString() {
    return stringify(this);
  }

  static zero() {
    return new Decimal(0);
  }

  static ten() {
    return new Decimal(10);
  }
}

/**
 * Constants
 */
Decimal.NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
Decimal.DP = 20; // decimal point
Decimal.RM = 1; // rounding mode
Decimal.NE = -7; // negative exponent
Decimal.PE = 21; // positive exponent
Decimal.UNDEFINED = void 0;
Decimal.MAX_DP = 1E6;
Decimal.MAX_POW = 1E6;

/**
 * Helper
 */
function parse(Dec, dec) {
  if (dec === 0 && 1 / dec < 0) dec = '-0';
  assert(Decimal.NUMERIC.test(dec += ''), 'Invalid number.');

  let e, i, l;
  Dec.s = dec.charAt(0) == '-' ? (dec = dec.slice(1), -1) : 1;
  if ((e = dec.indexOf('.')) > -1) dec = dec.replace('.', '');

  if ((i = dec.search(/e/i)) > 0) {
    if (e < 0) e = i;
    e += +dec.slice(i + 1);
    dec = dec.substring(0, i);
  } else if (e < 0) {
    e = dec.length;
  }

  l = dec.length;

  for (i = 0; i < l && dec.charAt(i) == '0';) ++i;

  if (i == l) {
    Dec.c = [Dec.e = 0];
  } else {
    for (; l > 0 && dec.charAt(--l) == '0';);
    Dec.e = e - i - 1;
    Dec.c = [];
    for (e = 0; i <= l;) Dec.c[e++] = +dec.charAt(i++);
  }

  return Dec;
}

function stringify(Dec, id, n, k) {
  let e, s, z = !Dec.c[0];

  if (n !== Decimal.UNDEFINED) {
    if (n !== ~~n || n < (id == 3) || n > Decimal.MAX_DP)
      throw Error(id == 3 ? 'Invalid precision.' : 'Invalid decimal point.');

    Dec = new Decimal(Dec);
    n = k - Dec.e;

    if (Dec.c.length > ++k) round(Dec, n, Decimal.RM);
    if (id == 2) k = Dec.e + n + 1;
    for (; Dec.c.length < k;) Dec.c.push(0);
  }

  e = Dec.e;
  s = Dec.c.join('');
  n = s.length;

  if (id != 2 && (id == 1 || id == 3 && k <= e || e <= Decimal.NE || e >= Decimal.PE)) {
    s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;
  } else if (e < 0) {
    for (; ++e;) s = '0' + s;
    s = '0.' + s;
  } else if (e > 0) {
    if (++e > n) for (e -= n; e--;) s += '0';
    else if (e < n) s = s.slice(0, e) + '.' + s.slice(e);
  } else if (n > 1) {
    s = s.charAt(0) + '.' + s.slice(1);
  }

  return Dec.s < 0 && (!z || id == 4) ? '-' + s : s;
}

function round(Dec, dp, rm, more) {
  let xc = Dec.c,
      i = Dec.e + dp + 1;

  if (i < xc.length) {
    if (rm === 1) {
      more = xc[i] >= 5;
    } else if (rm === 2) {
      more = xc[i] > 5 || xc[i] == 5 && (more || i < 0 || xc[i + 1] !== Decimal.UNDEFINED || xc[i - 1] & 1);
    } else if (rm === 3) {
      more = more || xc[i] !== Decimal.UNDEFINED || i < 0;
    } else {
      more = false;
      if (rm !== 0) throw Error('Invalid rounding mode.');
    }
    if (i < 1) {
      xc.length = 1;
      if (more) {
        Dec.e = -dp;
        xc[0] = 1;
      } else {
        xc[0] = Dec.e = 0;
      }
    } else {
      xc.length = i--;
      if (more) {
        for (; ++xc[i] > 9;) {
          xc[i] = 0;
          if (!i--) {
            ++Dec.e;
            xc.unshift(1);
          }
        }
      }
      for (i = xc.length; !xc[--i];) xc.pop();
    }
  } else if (rm < 0 || rm > 3 || rm !== ~~rm) {
    throw Error('Invalid rounding mode.');
  }
  return Dec;
}

/**
 * Expose
 */
module.exports = Decimal;