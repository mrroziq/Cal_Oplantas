// Data Graf Simpang
const grafData = {
    3: {
        nama: "Jalan Lalu Lintas 3 Simpang"
    },
    4: {
        nama: "Jalan Lalu Lintas 4 Simpang"
    },
    5: {
        nama: "Jalan Lalu Lintas 5 Simpang"
    }
}

// Ambil Parameter URL
const params = new URLSearchParams(window.location.search);
const graf = params.get("graf");
filterGraf(graf);

// Tampilan Input Graf
function filterGraf(jumlahSimpang) {
    const container = document.getElementById("grafContainer");
    let inputMatrix = "";
    for (let i=0; i < jumlahSimpang; i++) {
        inputMatrix += `
            <div class="matrix-row">
                <h3>Simpang ${i + 1}</h3>
        `;
        for (let j = 0; j < jumlahSimpang; j++) {
            inputMatrix +=`
                <div class="input-group">
                    <label>
                        q${i + 1}${j + 1}
                        
                        (Panjang antrian dari simpang ${i +1} ke simpang ${j + 1})
                    </label>
                    <input
                        type = "number"
                        min = "0"
                        step = "1"
                        id = "q-${i}-${j}"
                        value = "${i === j ? 0 : 10}"
                    >
                </div>
            `;
        }
        inputMatrix +=`
            </div>
        `;
    }

    // Tampilan Utama
    container.innerHTML = `
        <div class="card">
            <h2>${grafData[jumlahSimpang].nama}</h2>
            <img src="jalur${jumlahSimpang}simpang.jpg" class="image">
            
            <p>
                Masukkan waktu kendaraan meninggalkan simpang (detik):
            </p>

            <div class="input-a">
                <div class="input-group">
                    <label>
                        Waktu kendaraan
                        meninggalkan simpang (a)
                    </label>
                    <input
                        type="text"
                        id="a"
                        value="2"
                    >
                </div>
            </div>
            
            <p>
                Masukkan panjang kendaraan (banyak kendaraan setiap jalur):
            </p>

            ${inputMatrix}
            <button onclick="hitungOptimasi(${jumlahSimpang})">
                Hitung Optimasi
            </button>
            <div id="hasil"></div>
        </div>
    `;
}

// Membentuk matrix bobot Aij = a * qij
function buildMatrix(n, a) {
    const matrix = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            const el = document.getElementById(`q-${i}-${j}`);
            let qij = 0;
            if (el) {
                qij = parseFloat(el.value);
            }

            // validasi
            if (isNaN(qij) || qij < 0) {
                qij = 0;
            }

            // Bobot Aij = a * qij
            const Aij = a * qij;
            row.push(Aij);
        }
        matrix.push(row);
    }
    return matrix;
}

// Identifikasi siklus dan hitung lambda max(w(C)/|C|)
function hitungLambda(matrix) {
    const n = matrix.length;
    let lambda = 0;
    const visited = Array(n).fill(false);
    function dfs(start, current, path, weight) {
        if (path.length > n)
            return;
        for (
            let next = 0;
            next < n;
            next++
        ) {
            if (matrix[current][next] > 0) {
                if (next === start && path.length > 1) {
                    const panjang = path.length;
                    const w = weight + matrix[current][next];
                    lambda = Math.max(lambda, w / panjang);
                }
                if (!visited[next]) {
                    visited[next] = true;
                    dfs(
                        start,
                        next,
                        [...path, next],
                        weight + matrix[current][next]
                    );
                    visited[next] = false;
                }
            }
        }
    }
    for (let i = 0; i < n; i++) {
        visited[i] = true;
        dfs(i, i, [i], 0);
        visited[i] = false;
    }
    return lambda;
}

// Vektor Eigen Max-Plus
function hitungEigenVektor(matrix, lambda) {
    const n = matrix.length;
    let v = Array(n).fill(0);
    const ITER = 20;
    for (let iter = 0; iter < ITER; iter++) {
        let maxVal = -Infinity;
        const newV = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (matrix[i][j] > 0) {
                    maxVal = Math.max(maxVal, matrix[i][j] + v[j]);
                }
            }
        if (maxVal === -Infinity) {maxVal = 0};
        newV[i] = maxVal - lambda;
        }
        v = newV;
    }
    return v;
}

// Durasi Lampu Hijau
function hitungDurasi (matrix, lambda) {
    const n = matrix.length;
    const hasil = [];
    let totalBobot = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            totalBobot += matrix[i][j];
        }
    }
    
    for (let i = 0; i < n; i++) {
    const row = [];
        for (let j = 0; j < n; j++) {
            let dij = 0;
            if (totalBobot > 0) {
                dij = (matrix[i][j] / totalBobot) * lambda;
            }
            row.push(dij);
        }
    hasil.push(row);
    }
return hasil;
}

// Optimasi Utama
function hitungOptimasi(n) {
    const inputA = document.getElementById("a").value.trim();
    let a = 0;
    if (inputA.includes("/")){
        const pecahan = inputA.split("/");
        const atas = parseFloat(pecahan[0]);
        const bawah = parseFloat(pecahan[1]);
        if (!isNaN(atas) && !isNaN(bawah) && bawah !== 0) {
            a = atas / bawah;
        }
    }
    else {
        a = parseFloat(inputA)
    }
    if (isNaN(a) || a < 0) {
        alert ("Nilai a tidak valid");
        return;
    }
    const matrix = buildMatrix(n, a);
    const lambda = hitungLambda(matrix)
    const v = hitungEigenVektor(matrix, lambda);
    const durasi = hitungDurasi(matrix, lambda);
    let html = `
        <h2> Hasil Optimasi </h2>
    `;
        //<p>
        //    Nilai Eigen λ :
        //    ${lambda.toFixed(2)}
        //</p>

    //html += `
    //    <h3>
    //        Matriks Bobot A
    //    </h3>
    //`;
    //matrix.forEach(
    //    (row, i) => {
    //        html += `<p>`;
    //        row.forEach(
    //            (val, j) => {
    //                html +=`
    //                    A${i + 1}${j + 1} = ${val.toFixed(2)}&nbsp;&nbsp;
    //                `;
    //            }
    //        );
    //        html += `</p>`;
    //    }
    //);

    // Hasil Setiap Simpang
    for (let i = 0; i < n; i++) {
        let hijau = 0;
        for (let j = 0; j < n; j++){
            hijau += durasi[i][j];
        }
        const merah = lambda - hijau
        html += `
            <div class="hasil-item">
                <h3>Simpang ${i + 1}</h3>
        `;
                //<p>Eigen Vektor: ${v[i].toFixed(2)}</p>

        html += `
                <p>
                    🟢 Lampu Hijau: ${hijau.toFixed(2)} detik  
                </p>
                <p>
                    🔴 Lampu Merah: ${merah.toFixed(2)} detik
                </p>
            `;
        html +=`
            </div>
        `;
    }
    document.getElementById("hasil").innerHTML = html;
}