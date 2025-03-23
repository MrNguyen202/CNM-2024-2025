const AWS = require('aws-sdk');
const express = require('express');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('publics'));

// Cấu hình AWS
AWS.config.update({
    region: 'your-region',
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-access-key'
});

const docClient = new AWS.DynamoDB.DocumentClient();

//
const tabName = "Product";

const multer = require('multer');

const upload = multer();

// Route chính
app.get('/', async (req, res) => {
    const params = { TableName: tabName };
    docClient.scan(params, (err, data) => {
        if (err) {
            console.error(err);
            res.render('index', { sanPhams: [] });
        } else {
            res.render('index', { sanPhams: data.Items });
        }
    });
});

// Thêm sản phẩm
app.post('/add', upload.fields([]), (req, res) => {
    const { ma_sp, ten_sp, so_luong } = req.body;

    const params = {
        TableName: tabName,
        Item: {
            "ma_sp": parseInt(ma_sp),
            "ten_sp": ten_sp,
            "so_luong": parseInt(so_luong),
            "hinh_anh": "https://picsum.photos/200/300",
        }
    };

    console.log('Inserting item into DynamoDB:', params.Item);
    docClient.put(params, (err) => {
        if (err) {
            console.error('Error inserting item:', err);
        } else {
            console.log(`Successfully inserted product: ${ma_sp}`);
        }
        res.redirect('/');
    });
});

// Xóa sản phẩm (hỗ trợ xóa nhiều)
app.post('/delete', upload.fields([]), async (req, res) => {
    const maSanPhamList = Object.keys(req.body);

    if (maSanPhamList.length === 0) {
        return res.redirect("/");
    }

    try {
        for (const ma_sp of maSanPhamList) {
            const params = {
                TableName: tabName,
                Key: {
                    "ma_sp": parseInt(ma_sp)
                }
            };

            await new Promise((resolve, reject) => {
                docClient.delete(params, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        res.redirect("/");
    } catch (err) {
        console.error("Error deleting items:", err);
        res.status(500).send("Internal server error");
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
