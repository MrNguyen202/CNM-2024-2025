const express = require('express');
const app = express();

app.use(express.json({ extended: false }));
app.use(express.static('./views'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
    const data = [
        {
            stt: 1,
            tenMonHoc: 'Cơ sở dữ liệu',
            loaiMonHoc: 'Cơ sở',
            hocKy: "HK1 2021-2022",
            khoa: 'CNTT',
        },
        {
            stt: 2,
            tenMonHoc: 'Lập trình web',
            loaiMonHoc: 'Chuyên ngành',
            hocKy: "HK1 2021-2022",
            khoa: 'CNTT',
        },
        {
            stt: 3,
            tenMonHoc: 'Lập trình hướng đối tượng',
            loaiMonHoc: 'Cơ sở',
            hocKy: "HK1 2021-2022",
            khoa: 'CNTT',
        },
        {
            stt: 4,
            tenMonHoc: 'Cấu trúc dữ liệu và giải thuật',
            loaiMonHoc: 'Cơ sở',
            hocKy: "HK1 2021-2022",
            khoa: 'CNTT',
        }
    ];
    return res.render('index', { data });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});