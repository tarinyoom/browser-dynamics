use std::f64::consts::PI;

pub fn kernel(r: f64, inv_h: f64) -> f64 {
    let norm = 10.0 * inv_h * inv_h / (7.0 * PI);
    
    let q = 2.0 * r * inv_h;
    
    if q >= 2.0 {
        0.0
    } else if q < 1.0 {
        norm * (4.0 - 6.0 * q * q + 3.0 * q * q * q)
    } else {
        let term = 2.0 - q;
        norm * term * term * term
    }
}

pub fn d_kernel(r: f64, inv_h: f64) -> f64 {
    let norm = 10.0 * inv_h * inv_h / (7.0 * PI);
    
    let q = 2.0 * r * inv_h;
    
    if q >= 2.0 {
        0.0
    } else if q < 1.0 {
        norm * (-12.0 * q + 9.0 * q * q) * 2.0 * inv_h
    } else {
        let term = 2.0 - q;
        -6.0 * norm * term * term * inv_h
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scan(a: f64, b: f64, step: f64) -> Vec<f64> {
        let mut out = Vec::new();
        let mut x = a;
        while x <= b + 1e-15 {
            out.push(x);
            x += step;
        }
        out
    }

    const INV_HS: [f64; 4] = [0.5, 1.0, 2.0, 4.0];

    #[test]
    fn test_kernel_support() {
        for &inv_h in &INV_HS {
            let h = 1.0 / inv_h;
            let step = h / 200.0;

            for r in scan(0.0, h - 1e-8, step) {
                let w = kernel(r, inv_h);
                assert!(w > 0.0, "kernel should be positive within support for inv_h={}, r={}", inv_h, r);
            }

            for r in scan(h, 3.0 * h, step) {
                let w = kernel(r, inv_h);
                assert_eq!(w, 0.0, "kernel should be zero outside support for inv_h={}, r={}", inv_h, r);
            }
        }
    }

    #[test]
    fn test_kernel_strictly_decreasing() {
        for &inv_h in &INV_HS {
            let h = 1.0 / inv_h;
            let rs = scan(0.0, 2.0 * h, h / 2000.0);

            let w0 = kernel(0.0, inv_h);
            assert!(w0 > 0.0, "kernel at origin should be positive for inv_h={}", inv_h);

            let mut prev = w0;
            for i in 1..rs.len() {
                let w = kernel(rs[i], inv_h);
                assert!(w <= prev + 1e-12, "kernel should be non-increasing for inv_h={}, r={}", inv_h, rs[i]);
                prev = w;
            }
        }
    }

    #[test]
    fn test_derivative_consistency() {
        for &inv_h in &INV_HS {
            let h = 1.0 / inv_h;
            let delta = h / 200000.0;
            let rs = scan(5.0 * delta, h - 5.0 * delta, h / 4000.0);

            for r in rs {
                let w_plus = kernel(r + delta, inv_h);
                let w_minus = kernel(r - delta, inv_h);
                let fd = (w_plus - w_minus) / (2.0 * delta);

                let d = d_kernel(r, inv_h);

                let atol = 1e-8 * inv_h.powi(3);
                let rtol = 5e-4;
                let tol = atol.max(rtol * (1e-16_f64.max(d.abs()).max(fd.abs())));

                assert!(
                    (fd - d).abs() <= tol,
                    "derivative mismatch for inv_h={}, r={}: finite_diff={}, analytical={}, diff={}, tol={}",
                    inv_h, r, fd, d, (fd - d).abs(), tol
                );
            }
        }
    }

    #[test]
    fn test_2d_normalization() {
        for &inv_h in &INV_HS {
            let h = 1.0 / inv_h;
            let box_half = (1.0_f64).max(2.0 * h);
            let n = 401;
            let step = (2.0 * box_half) / (n - 1) as f64;
            let mut riemann = 0.0;

            for i in 0..n {
                let x = -box_half + i as f64 * step;
                for j in 0..n {
                    let y = -box_half + j as f64 * step;
                    let r = (x * x + y * y).sqrt();
                    riemann += kernel(r, inv_h) * (step * step);
                }
            }

            assert!(
                riemann > 1.0 - 1e-8,
                "2D normalization too low for inv_h={}: {}",
                inv_h, riemann
            );
            assert!(
                riemann < 1.0 + 1e-8,
                "2D normalization too high for inv_h={}: {}",
                inv_h, riemann
            );
        }
    }
}