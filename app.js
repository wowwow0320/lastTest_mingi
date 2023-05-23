const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const { hashPassword } = require("mysql/lib/protocol/Auth");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

// 익스프레스 객체 정의
const app = express();

//데이터베이스 연결
const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "0322",
  database: "web",
});

//연결 오류시 에러메시지 출력
connection.connect((err) => {
  if (err) {
    console.error("데이터 베이스와 연결에 실패했습니다." + err.stack);
    return;
  }
  console.log("데이터 베이스 연결 완료");
});

module.exports = connection;

app.use(
  session({
    secret: "secretCode",
    resave: true,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));

// body-parser 미들웨어를 이용하면, request의 body부분을 자신이 원하는 형태로 파싱하여 활용할 수 있다.

// url-encoded 형태인 'age=20&name=뽀뽀뽀&hobby=캠핑' 로 값을 전달하면, {'age':20, 'name':'뽀뽀뽀', 'hobby':'캠핑'} 형태로 값이 request의 body에 추가된다.

// {extended:false}  부분은 아래와 같이 작동한다.
// - true : Express에 기본 내장된 querystring 모듈을 사용한다.
// - false : querystring 모듈의 기능이 좀 더 확장된 qs 모듈을 사용한다. (qs 모듈 별도 설치 필요)
// querystring: 쿼리 문자열을 쿼리 객체로 바꿔주는 역할

// app.use(express.static(path.join(__dirname, "public"))); 아직 퍼블릭 폴더가 없음

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs"); // views폴더의 템플릿 엔진 ejs 파일

//GET 요청이 root 경로("/")로 들어오면 'index.ejs'를 렌더링합니다.
// 로그인이 필요한 페이지에 접근하는 경우 사용
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/login");
}

// 로그인이 되어 있는 상태에서 로그인 또는 회원 가입 페이지에 접근하는 경우 사용
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  return next();
}


app.get("/", (req, res) => {
  res.render("index.ejs");
});

// GET 요청이 '/join' 경로로 들어오면 'join.ejs'를 렌더링합니다.
app.get("/join", checkNotAuthenticated, (req, res) => {
  res.render("join.ejs");
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.get("/findemail", checkNotAuthenticated, (req, res) => {
  res.render("findemail.ejs");
});

app.get("/findpwd", checkNotAuthenticated, (req, res) => {
  res.render("findpwd.ejs");
});

app.get("/changepwd", checkNotAuthenticated, (req, res) => {
  res.render("changepwd.ejs");
});
app.get("/community/createplan", checkAuthenticated, (req, res) => {
    res.render("createplan.ejs");
});
app.get('/community/updateplan/:planid', checkAuthenticated, (req, res) => {
    const planId = req.params.planid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID

    // 게시물 조회 SQL 쿼리 실행
    const query = 'SELECT * FROM plan WHERE planid = ? AND writer = ?';
    connection.query(query, [planId, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('게시물 조회 중 오류가 발생했습니다.');
        } else {
            if (results && results.length > 0) {
                const plan = results[0];
                console.log("plan성공");
                res.status(200).render('updateplan.ejs', { plan }); // 게시물 수정 페이지 렌더링
            } else {
                res.status(404).send('해당하는 게시물을 찾을 수 없습니다.');
            }
        }
    });
});
app.get('/community/deleteplan/:planid', checkAuthenticated, (req, res) => {
    const planId = req.params.planid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID

    // 게시물 조회 SQL 쿼리 실행
    const query = 'SELECT * FROM plan WHERE planid = ? AND writer = ?';
    connection.query(query, [planId, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('게시물 조회 중 오류가 발생했습니다.');
        } else {
            if (results && results.length > 0) {
                const plan = results[0];
                res.status(200).send('게시물 조회 성공');
            } else {
                res.status(404).send('해당하는 게시물을 찾을 수 없습니다.');
            }
        }
    });
});
app.get("/community/createpost", checkAuthenticated, (req, res) => {
    res.render("createpost.ejs");
});
app.get('/community/updatepost/:postid', checkAuthenticated, (req, res) => {
    const postId = req.params.postid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID

    // 게시물 조회 SQL 쿼리 실행
    const query = 'SELECT * FROM post WHERE postid = ? AND writer = ?';
    connection.query(query, [postId, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('post 조회 중 오류가 발생했습니다.');
        } else {
            if (results && results.length > 0) {
                const post = results[0];
                console.log("성공");
                res.status(200).render('updatepost.ejs', { post }); // 게시물 수정 페이지 렌더링
            } else {
                res.status(404).send('해당하는 post 찾을 수 없습니다.');
            }
        }
    });
});
app.get('/community/deletepost/:postid', checkAuthenticated, (req, res) => {
    const postId = req.params.postid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID

    // 게시물 조회 SQL 쿼리 실행
    const query = 'SELECT * FROM post WHERE postid = ? AND writer = ?';
    connection.query(query, [postId, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('post 조회 중 오류가 발생했습니다.');
        } else {
            if (results && results.length > 0) {
                const post = results[0];
                res.status(200).send('post 조회 성공');
            } else {
                res.status(404).send('해당하는 post 찾을 수 없습니다.');
            }
        }
    });
});
app.get('/notice/create', checkAuthenticated, (req, res) =>{
    res.render("create.ejs");
});
app.get('/notice/update/:noticeid', checkAuthenticated, (req, res) =>{
    const noticeId = req.params.noticeid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID

    // 게시물 조회 SQL 쿼리 실행
    const query = 'SELECT * FROM notice WHERE noticeid = ? AND writer = ?';
    connection.query(query, [noticeid, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('notice 조회 중 오류가 발생했습니다.');
        } else {
            if (results && results.length > 0) {
                const notice = results[0];
                console.log("성공");
                res.status(200).render('update.ejs', { notice }); //  수정 페이지 렌더링
            } else {
                res.status(404).send('해당하는 notice 찾을 수 없습니다.');
            }
        }
    });
});
app.get('/notice/delete/:noticeid', checkAuthenticated, (req, res) =>{
    const noticeId = req.params.noticeid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID

    // 게시물 조회 SQL 쿼리 실행
    const query = 'SELECT * FROM notice WHERE noticeid = ? AND writer = ?';
    connection.query(query, [noticeid, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('notice 조회 중 오류가 발생했습니다.');
        } else {
            if (results && results.length > 0) {
                const notice = results[0];
                console.log("성공");
                res.status(200).render('delete.ejs', { notice }); //  수정 페이지 렌더링
            } else {
                res.status(404).send('해당하는 notice 찾을 수 없습니다.');
            }
        }
    });
});

// POST 요청이 '/join' 경로로 들어오면, 사용자의 정보를 데이터베이스에 저장하고 성공 메시지를 반환합니다. 오류가 발생하면 오류 메시지를 반환합니다.
// app.post("/join", (req, res) => {
//   const { name, email, pwd, question, answer } = req.body;
//
//   const query =
//     "INSERT INTO user (name, email, pwd, question, answer) VALUES (?, ?, ?, ?, ?)";
//
//   // 비밀번호 암호화
//   bcrypt.hash(pwd, 10, (err, hashedPwd) => {
//     if (err) {
//       console.error(err);
//       res.status(500).send("회원 가입 중 오류가 발생했습니다.");
//       return;
//     }
//     const params = [name, email, hashedPwd, question, answer];
//     // 암호화된 비밀번호를 데이터베이스에 저장
//     connection.query(query, params, (err, result) => {
//       if (err) {
//         console.error(err);
//         res.status(500).send("회원 가입 중 오류가 발생했습니다.");
//       } else {
//         res.send("회원 가입 성공!");
//       }
//     });
//   });
// });

app.post("/join", (req, res) => {
  const { name, email, pwd, question, answer } = req.body;

  // 입력 데이터 확인
  if (!name || !email || !pwd || !question || !answer) {
    return res.status(400).send("모든 필드를 입력해주세요.");
  }

  // 비밀번호 암호화
  bcrypt.hash(pwd, 10, (err, hashedPwd) => {
    if (err) {
      console.error(err);
      return res.status(500).send("서버 오류: 비밀번호 암호화 실패");
    }

    // 중복 확인
    connection.query(
      "SELECT * FROM user WHERE email = ?",
      [email],
      function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).send("서버 오류: 이메일 중복 확인 실패");
        }

        if (results.length > 0) {
          return res.status(409).send("이미 존재하는 이메일입니다.");
        }

        const params = [name, email, hashedPwd, question, answer];
        const query =
          "INSERT INTO user (name, email, pwd, question, answer) VALUES (?, ?, ?, ?, ?)";

        // 암호화된 비밀번호를 데이터베이스에 저장
        connection.query(query, params, (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send("서버 오류: 데이터베이스 입력 실패");
          }
          res.status(200).send("회원가입 성공!");
        });
      }
    );
  });
});

// app.post(
//   "/login",
//   passport.authenticate("local", {
//     failureRedirect: "/fail",
//   }),
//   (req, res) => {
//     res.redirect("/");
//   }
// );
//
// passport.use(
//   new LocalStrategy(
//     {
//       usernameField: "email",
//       passwordField: "pwd",
//       session: true,
//       passReqToCallback: false,
//     },
//     function (inputEmail, inputPwd, done) {
//       connection.query(
//         "SELECT * FROM user WHERE email = ?",
//         [inputEmail],
//         function (err, results) {
//           if (err) {
//             return done(err);
//           }
//
//           if (results.length === 0) {
//             return done(null, false, {
//               message: "존재하지 않는 아이디입니다.",
//             });
//           }
//
//           const user = results[0];
//           bcrypt.compare(inputPwd, user.pwd, function (err, isMatch) {
//             if (err) {
//               return done(err);
//             }
//
//             if (isMatch) {
//               return done(null, user);
//             } else {
//               return done(null, false, {
//                 message: "비밀번호가 일치하지 않습니다.",
//               });
//             }
//           });
//         }
//       );
//     }
//   )
// );

app.post(
  "/login",
  (req, res, next) => {
    // 입력 데이터 확인
    if (!req.body.email || !req.body.pwd) {
      return res.status(400).send("모든 필드를 입력해주세요.");
    }
    next();
  },
  passport.authenticate("local"),
  (req, res) => {
    if (req.user) {
      res.status(200).send("로그인 성공!");
    }
  },
  (err, req, res, next) => {
    // DB 혹은 서버 오류 처리
    if (err) {
      return res.status(500).send("서버 오류: 로그인 실패");
    }

    // 비밀번호 불일치 혹은 존재하지 않는 아이디 처리
    if (!req.user) {
      return res.status(401).send("아이디 혹은 비밀번호가 일치하지 않습니다.");
    }
  }
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "pwd",
      session: true,
      passReqToCallback: false,
    },
    function (inputEmail, inputPwd, done) {
      connection.query(
        "SELECT * FROM user WHERE email = ?",
        [inputEmail],
        function (err, results) {
          if (err) {
            return done(err);
          }

          if (results.length === 0) {
            return done(null, false);
          }

          const user = results[0];
          bcrypt.compare(inputPwd, user.pwd, function (err, isMatch) {
            if (err) {
              return done(err);
            }

            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false);
            }
          });
        }
      );
    }
  )
);

// app.post("/findemail", (req, res) => {
//   const { name, question, answer } = req.body;
//
//   const query =
//     "SELECT email FROM user WHERE name = ? AND question = ? AND answer = ?";
//
//   const params = [name, question, answer];
//
//   connection.query(query, params, (err, results) => {
//     if (err) {
//       console.error(err);
//       res.status(500).send("이메일 찾기 중 오류가 발생했습니다.");
//       return;
//     }
//
//     if (results.length === 0) {
//       res
//         .status(401)
//         .send("입력하신 정보와 일치하는 사용자를 찾을 수 없습니다.");
//     } else {
//       // 주의: 실제 서비스에서는 이메일을 그대로 출력하는 것이 아니라, 일부를 마스킹 처리하거나
//       // 다른 방법으로 사용자의 이메일을 직접 노출하지 않는 방법을 사용해야 합니다.
//       res.status(200).send(`찾으시는 이메일은 ${results[0].email} 입니다.`);
//     }
//   });
// });

app.post("/findemail", (req, res) => {
  const { name, question, answer } = req.body;

  // 입력 데이터 확인
  if (!name || !question || !answer) {
    return res.status(400).send("모든 필드를 입력해주세요.");
  }

  const query =
    "SELECT email FROM user WHERE name = ? AND question = ? AND answer = ?";

  const params = [name, question, answer];

  connection.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("이메일 찾기 중 오류가 발생했습니다.");
    }

    if (results.length === 0) {
      return res
        .status(401)
        .send("입력하신 정보와 일치하는 사용자를 찾을 수 없습니다.");
    } else {
      // 주의: 실제 서비스에서는 이메일을 그대로 출력하는 것이 아니라, 일부를 마스킹 처리하거나
      // 다른 방법으로 사용자의 이메일을 직접 노출하지 않는 방법을 사용해야 합니다.
      return res
        .status(200)
        .send(`찾으시는 이메일은 ${results[0].email} 입니다.`);
    }
  });
});

// app.post("/findpwd", (req, res) => {
//   const { name, email, question, answer } = req.body;
//
//   connection.query(
//     "SELECT * FROM user WHERE name = ? AND email = ? AND question = ? AND answer = ?",
//     [name, email, question, answer],
//     function (err, results) {
//       if (err) {
//         return res.status(500).send("서버 에러");
//       }
//
//       if (results.length === 0) {
//         return res.send("입력하신 정보와 일치하는 사용자가 없습니다.");
//       }
//
//       // 해당 정보와 일치하는 사용자가 있을 경우, changepwd 페이지로 이동
//       res.redirect("/changepwd");
//     }
//   );
// });

app.post("/findpwd", (req, res) => {
  const { name, email, question, answer } = req.body;

  // 입력 데이터 확인
  if (!name || !email || !question || !answer) {
    return res.status(400).send("모든 필드를 입력해주세요.");
  }

  connection.query(
    "SELECT * FROM user WHERE name = ? AND email = ? AND question = ? AND answer = ?",
    [name, email, question, answer],
    function (err, results) {
      if (err) {
        console.error(err);
        return res.status(500).send("비밀번호 찾기 중 오류가 발생했습니다.");
      }

      if (results.length === 0) {
        return res
          .status(401)
          .send("입력하신 정보와 일치하는 사용자를 찾을 수 없습니다.");
      }

      // 해당 정보와 일치하는 사용자가 있을 경우, changepwd 페이지로 이동
      res.status(200).redirect("/changepwd");
    }
  );
});

// app.post("/changepwd", (req, res) => {
//   const { email, newPwd } = req.body;
//
//   // 입력된 새 비밀번호가 없는 경우 에러 메시지를 반환합니다.
//   if (!newPwd) {
//     return res.status(400).send("새 비밀번호를 입력해주세요.");
//   }
//
//   // 기존 비밀번호를 데이터베이스에서 가져옵니다.
//   connection.query(
//     "SELECT pwd FROM user WHERE email = ?",
//     [email],
//     function (err, results) {
//       if (err) {
//         return res.status(500).send("서버 에러");
//       }
//
//       if (results.length === 0) {
//         return res.send("해당 이메일의 사용자가 없습니다.");
//       }
//
//       // 가져온 기존 비밀번호를 암호화된 형태로 저장합니다.
//       const oldPwd = results[0].pwd;
//
//       // bcrypt.compare를 이용해 새 비밀번호와 기존 비밀번호를 비교합니다.
//       bcrypt.compare(newPwd, oldPwd, function (err, isMatch) {
//         if (err) {
//           return res.status(500).send("비밀번호 비교 중 오류가 발생했습니다.");
//         }
//
//         // 만약 새 비밀번호와 기존 비밀번호가 같다면 에러 메시지를 반환합니다.
//         if (isMatch) {
//           return res.send(
//             "새 비밀번호가 기존 비밀번호와 동일합니다. 다시 입력해주세요."
//           );
//         }
//
//         // 새 비밀번호를 암호화합니다.
//         bcrypt.hash(newPwd, 10, (err, hashedPwd) => {
//           if (err) {
//             console.error(err);
//             res.status(500).send("비밀번호 변경 중 오류가 발생했습니다.");
//             return;
//           }
//
//           // 데이터베이스에 새 비밀번호를 저장합니다.
//           connection.query(
//             "UPDATE user SET pwd = ? WHERE email = ?",
//             [hashedPwd, email],
//             (err, result) => {
//               if (err) {
//                 console.error(err);
//                 res.status(500).send("비밀번호 변경 중 오류가 발생했습니다.");
//               } else {
//                 res.send("비밀번호 변경 성공!");
//               }
//             }
//           );
//         });
//       });
//     }
//   );
// });

app.post("/changepwd", (req, res) => {
  const { email, newPwd } = req.body;

  // 입력된 새 비밀번호가 없는 경우 에러 메시지를 반환합니다.
  if (!newPwd || !email) {
    return res.status(400).send("모든 필드를 입력해주세요.");
  }

  // 기존 비밀번호를 데이터베이스에서 가져옵니다.
  connection.query(
    "SELECT pwd FROM user WHERE email = ?",
    [email],
    function (err, results) {
      if (err) {
        console.error(err);
        return res.status(500).send("비밀번호 변경 중 오류가 발생했습니다.");
      }

      if (results.length === 0) {
        return res.status(401).send("해당 이메일의 사용자를 찾을 수 없습니다.");
      }

      // 가져온 기존 비밀번호를 암호화된 형태로 저장합니다.
      const oldPwd = results[0].pwd;

      // bcrypt.compare를 이용해 새 비밀번호와 기존 비밀번호를 비교합니다.
      bcrypt.compare(newPwd, oldPwd, function (err, isMatch) {
        if (err) {
          console.error(err);
          return res.status(500).send("비밀번호 비교 중 오류가 발생했습니다.");
        }

        // 만약 새 비밀번호와 기존 비밀번호가 같다면 에러 메시지를 반환합니다.
        if (isMatch) {
          return res
            .status(400)
            .send(
              "새 비밀번호가 기존 비밀번호와 동일합니다. 다시 입력해주세요."
            );
        }

        // 새 비밀번호를 암호화합니다.
        bcrypt.hash(newPwd, 10, (err, hashedPwd) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .send("비밀번호 변경 중 오류가 발생했습니다.");
          }

          // 데이터베이스에 새 비밀번호를 저장합니다.
          connection.query(
            "UPDATE user SET pwd = ? WHERE email = ?",
            [hashedPwd, email],
            (err, result) => {
              if (err) {
                console.error(err);
                return res
                  .status(500)
                  .send("비밀번호 변경 중 오류가 발생했습니다.");
              } else {
                res.status(200).send("비밀번호 변경 성공!");
              }
            }
          );
        });
      });
    }
  );
});
/*
app.post("/community/createplan", (req,res)=>{
  const date= req.body.date;
  const contents = req.body.contents;
  //const {date, contents} = req.body;
  // req.body는 클라이언트에서 서버로 전송된 POST 요청의 본문(body)에 포함된 데이터를 나타냅니다.
  const writer= req.body.userid;
  const query = "INSERT INTO plan (writer, date, contents) VALUES (?, ?, ?)";

  connection.query(
      query,
      [writer, date, contents],
      (err, results) => {
        if (err) {
          console.error(err);
          res.status(500).send("plan 생성 중 오류가 발생했습니다.");
        } else {
          if (results && results.affectedRows > 0) {
            // plan 생성 성공
            res.status(201).send("plan 생성 성공");
          } else {
            // plan 생성 실패
            res.status(400).send("plan 생성 입력이 올바르지 않습니다.");
          }
        }
      }
  );
});
*/
app.post("/community/createplan", (req, res) => {
  const {date, contents} = req.body;
  const writer = req.user.userid;

  if(!date || !contents){
    return res.status(400).send("모든 필드를 입력해주세요.");
  }
  const query = "INSERT INTO plan (writer, date, contents) VALUES (?, ?, ?)";
  connection.query(query, [writer, date, contents], (err, results) =>{
      console.log(results);
    if(err){
      console.error(err);
      res.status(500).send("plan 생성 중 오류가 발생했습니다.");
    } else{
      if(results && results.affectedRows >0){
        res.status(201).send("plan 생성 성공");
      } else{
        res.status(403).send("접근이 허용되지 않습니다.");
      }
    }
  });
});

/*
app.put("/community/updateplan/:id",  (req, res) => {
    const planId = req.params.id; // 게시글의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID
    const { date, contents } = req.body; // 수정하고자 하는 내용

    if (!date || !contents) {
        return res.status(400).send("모든 필드를 입력해주세요.");
    }

    const selectQuery = "SELECT * FROM plan WHERE id = ? AND writer = ?";
    const updateQuery = "UPDATE plan SET date = ?, contents = ? WHERE id = ? AND writer = ?";

    // 게시글 조회
    connection.query(selectQuery, [planId, writer], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("게시글 조회 중 오류가 발생했습니다.");
        }

        if (!results || results.length === 0) {
            return res.status(404).send("해당 게시글을 찾을 수 없습니다.");
        }

        // 게시글 업데이트
        connection.query(updateQuery, [date, contents, planId, writer], (err, updateResult) => {
            if (err) {
                console.error(err);
                return res.status(500).send("게시글 수정 중 오류가 발생했습니다.");
            }

            if (updateResult && updateResult.affectedRows > 0) {
                return res.status(200).send("게시글이 성공적으로 수정되었습니다.");
            } else {
                return res.status(403).send("게시글 수정 권한이 없습니다.");
            }
        });
    });
});
 */


/*
app.post("/community/updateplan", (req, res) => {


    connection.query(
   "SELECT id FROM plan WHERE writer = ? AND date = ? AND contents = ?",
   [writer, date, contents],
   function (err, results){
     if(err){
       console.error(err);
       return res.status(500).send("plan 수정 중 오류가 발생했습니다.");
     }

     if(results.length === 0){
       return res.status(403).send("접근이 허용되지 않습니다.");
     } else{
      const planId = results[0].id;

      connection.query(
        "UPDATE plan SET date = ?, contents = ? WHERE id = ?",
        [date, contents, planId],
        function(err, updateResult){
          if(err){
            console.error(err);
            return res.status(500).send("plan 수정 중 오류가 발생했습니다.");
          }
          if(updateResult.affectedRows === 0){
            return res.status(404).send("먼저 삭제된 plan입니다.");
          }
          return res.status(200).send("plan 수정 성공");
        }
      );
     }
    }
   );
});
*/

// plan 수정 처리
app.post('/community/updateplan/:planid',  (req, res) => {
    const planId = req.params.planid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID
    const { date, contents } = req.body; // 수정하고자 하는 내용

    if(!date || !contents){
        return res.status(400).send("모든 필드를 입력해주세요.");
    }

    // plan 업데이트 SQL 쿼리 실행
    const query = 'UPDATE plan SET date = ?, contents = ? WHERE planid = ? AND writer = ?';
    connection.query(query, [date, contents, planId, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('게시물 수정 중 오류가 발생했습니다.');
        } else {
            if (results && results.affectedRows > 0) {
                res.status(201).send('게시물이 성공적으로 수정되었습니다.');
            } else {
                res.status(403).send('게시물 수정 권한이 없습니다.');
            }
        }
    });
});
app.post('/community/deleteplan/:planid',  (req, res) => {
    const planId = req.params.planid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID

    // 게시물 삭제 SQL 쿼리 실행
    const query = 'DELETE FROM plan WHERE planid = ? AND writer = ?';
    connection.query(query, [planId, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('게시물 삭제 중 오류가 발생했습니다.');
        } else {
            if (results && results.affectedRows > 0) {
                res.status(201).send('게시물이 성공적으로 삭제되었습니다.');
            } else {
                res.status(403).send('게시물 삭제 권한이 없습니다.');
            }
        }
    });
});
app.post("/community/createpost", (req, res) => {
    const contents = req.body.contents;
    const writer = req.user.userid;

    if(!contents){
        return res.status(400).send("모든 필드를 입력해주세요.");
    }
    const query = "INSERT INTO post (writer, contents) VALUES (?, ?)";
    connection.query(query, [writer, contents], (err, results) =>{
        console.log(results);
        if(err){
            console.error(err);
            res.status(500).send("post 생성 중 오류가 발생했습니다.");
        } else{
            if(results && results.affectedRows >0){
                res.status(201).send("post 생성 성공");
            } else{
                res.status(403).send("접근이 허용되지 않습니다.");
            }
        }
    });
});

// 게시물 수정 처리
app.post('/community/updatepost/:postid',  (req, res) => {
    const postId = req.params.postid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID
    const contents  = req.body.contents; // 수정하고자 하는 내용

    if(!contents){
        return res.status(400).send("모든 필드를 입력해주세요.");
    }

    // 게시물 업데이트 SQL 쿼리 실행
    const query = 'UPDATE post SET contents = ? WHERE postid = ? AND writer = ?';
    connection.query(query, [contents, postId, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('post 수정 중 오류가 발생했습니다.');
        } else {
            if (results && results.affectedRows > 0) {
                res.status(201).send('post 성공적으로 수정되었습니다.');
            } else {
                res.status(403).send('post 수정 권한이 없습니다.');
            }
        }
    });
});
app.post('/community/deletepost/:postid',  (req, res) => {
    const postId = req.params.postid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID

    // 게시물 삭제 SQL 쿼리 실행
    const query = 'DELETE FROM post WHERE postid = ? AND writer = ?';
    connection.query(query, [postId, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('post 삭제 중 오류가 발생했습니다.');
        } else {
            if (results && results.affectedRows > 0) {
                res.status(201).send('post 성공적으로 삭제되었습니다.');
            } else {
                res.status(403).send('post 삭제 권한이 없습니다.');
            }
        }
    });
});
app.post("/notice/create", (req, res) => {
    const {title, contents, img} = req.body;
    const writer = req.user.userid;

    if(!title || !contents){
        return res.status(400).send("모든 필드를 입력해주세요.");
    }
    const query = "INSERT INTO notice (writer, contents, img, title) VALUES (?, ?, ?, ?)";
    connection.query(query, [writer, contents, img, title], (err, results) =>{
        console.log(results);
        if(err){
            console.error(err);
            res.status(500).send("notice 생성 중 오류가 발생했습니다.");
        } else{
            if(results && results.affectedRows >0){
                res.status(201).send("notice 생성 성공");
            } else{
                res.status(403).send("접근이 허용되지 않습니다.");
            }
        }
    });
});
app.post('/notice/update/:noticeid',  (req, res) => {
    const noticeId = req.params.noticeid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID
    const {title, contents, img} = req.body;

    if(!title || !contents){
        return res.status(400).send("모든 필드를 입력해주세요.");
    }

    // 게시물 업데이트 SQL 쿼리 실행
    const query = 'UPDATE notice SET contents = ? AND title = ? AND img = ? WHERE noticeid = ? AND writer = ?';
    connection.query(query, [contents, noticeId, writer, title, img], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('notice 수정 중 오류가 발생했습니다.');
        } else {
            if (results && results.affectedRows > 0) {
                res.status(201).send('notice 성공적으로 수정되었습니다.');
            } else {
                res.status(403).send('notice 수정 권한이 없습니다.');
            }
        }
    });
});
app.post('/notice/delete/:noticeid',  (req, res) => {
    const noticeId = req.params.noticeid; // 게시물의 고유 식별자(ID)
    const writer = req.user.userid; // 현재 로그인한 사용자의 ID

    // 게시물 삭제 SQL 쿼리 실행
    const query = 'DELETE FROM notice WHERE noticeid = ? AND writer = ?';
    connection.query(query, [noticeId, writer], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('notice 삭제 중 오류가 발생했습니다.');
        } else {
            if (results && results.affectedRows > 0) {
                res.status(201).send('notice 성공적으로 삭제되었습니다.');
            } else {
                res.status(403).send('notice 삭제 권한이 없습니다.');
            }
        }
    });
});


passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser((email, done) => {
  connection.query(
    "SELECT * FROM user WHERE email = ?",
    [email],
    function (err, results) {
      if (err) {
        return done(err);
      }

      if (results.length === 0) {
        return done(null, false, { message: "No user with this email." });
      }

      const user = results[0];
      done(null, user);
    }
  );
});


//앱이 3000 포트에서 실행되도록 설정합니다. 포트 번호는 환경 변수를 통해 변경할 수도 있습니다.

const PORT = process.env.PORT || 3000;

// 서버 실행

app.listen(3000, function () {
  console.log(`listening on port ${PORT}`);
});
