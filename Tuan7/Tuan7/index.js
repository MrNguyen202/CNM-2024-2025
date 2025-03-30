const AWS = require('aws-sdk');
const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('publics'));


// Cấu hình AWS
AWS.config.update({
    region: `${process.env.AWS_REGION}` || 'your-region',
    accessKeyId: `${process.env.AWS_ACCESS_KEY_ID}` || 'your-access-key',
    secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}` || 'your-secret-access-key'
});

// config xong mới tạo s3
const s3 = new AWS.S3();



const docClient = new AWS.DynamoDB.DocumentClient();

//
const tabName = "Product";

const multer = require('multer');

// Middleware để xử lý multipart/form-data
const storage = multer.memoryStorage({
    destination(req, file, cb) {
        cb(null, '');
    }
});

function fileFilter(file, cb) {
    const fileTypes = /jpg|jpeg|png|gif/;

    const extname = fileTypes.test(path.extname(file.originalname.toLowerCase()));
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }

    return cb('Error: File upload only supports the following filetypes - ' + fileTypes);
}

const upload = multer({
    storage,
    limits: { fileSize: 2000000 }, //2MB
    fileFilter: (req, file, cb) => {
        fileFilter(file, cb);
    }
});

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
// app.post('/add', upload.fields([]), (req, res) => {
//     const { ma_sp, ten_sp, so_luong } = req.body;

//     const params = {
//         TableName: tabName,
//         Item: {
//             "ma_sp": parseInt(ma_sp),
//             "ten_sp": ten_sp,
//             "so_luong": parseInt(so_luong),
//             "hinh_anh": "https://picsum.photos/200/300",
//         }
//     };

//     console.log('Inserting item into DynamoDB:', params.Item);
//     docClient.put(params, (err) => {
//         if (err) {
//             console.error('Error inserting item:', err);
//         } else {
//             console.log(`Successfully inserted product: ${ma_sp}`);
//         }
//         res.redirect('/');
//     });
// });

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

const ClOUD_FRONTEND = `${process.env.CLOUD_FRONT_URL}` || 'your-cloudfront-url';

// Upload hình ảnh
app.post('/add', upload.single('hinh_anh'), (req, res) => {
    const { ma_sp, ten_sp, so_luong } = req.body;
    const hinh_anh = req.file.originalname.split('.');

    const fileType = hinh_anh[hinh_anh.length - 1];

    const filePath = `${uuidv4() + Date.now().toString()}.${fileType}`;
    const params = {
        Bucket: 'uploads3-toturial-bucket-of-thuan',
        Key: filePath,
        Body: req.file.buffer,
    };

    s3.upload(params, (err, data) => {
        if (err) {
            console.error('Error uploading file:', err);
            return res.status(500).send('Error uploading file');
        }

        const params = {
            TableName: tabName,
            Item: {
                "ma_sp": parseInt(ma_sp),
                "ten_sp": ten_sp,
                "so_luong": parseInt(so_luong),
                "hinh_anh": `${ClOUD_FRONTEND}${filePath}`,
            }
        };

        docClient.put(params, (err, da) => {
            if (err) {
                console.error('Error inserting item:', err);
            } else {
                console.log(`Successfully inserted product: ${ma_sp}`);
            }
            res.redirect('/');
        });
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
