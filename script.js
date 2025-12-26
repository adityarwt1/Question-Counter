
(async ()=>{
  const reponose = await  fetch("https://api.penpencil.co/v2/poll/entity/6941247351bbbbdb401b6d4e/active-poll", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,hi;q=0.8,ne;q=0.7",
    "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NjcwMzA0NjEuMjYyLCJkYXRhIjp7Il9pZCI6IjY1NjVkYWZlZWU0M2I1YmIwYzU5MDc1YyIsInVzZXJuYW1lIjoiOTI0NDUyNDU2NSIsImZpcnN0TmFtZSI6IkFkaXR5YSIsImxhc3ROYW1lIjoiUmF3YXQiLCJvcmdhbml6YXRpb24iOnsiX2lkIjoiNWViMzkzZWU5NWZhYjc0NjhhNzlkMTg5Iiwid2Vic2l0ZSI6InBoeXNpY3N3YWxsYWguY29tIiwibmFtZSI6IlBoeXNpY3N3YWxsYWgifSwiZW1haWwiOiJhZGl0eWFyYXdhdG5ldzI0ODdAZ21haWwuY29tIiwicm9sZXMiOlsiNWIyN2JkOTY1ODQyZjk1MGE3NzhjNmVmIiwiNWNjOTVhMmU4YmRlNGQ2NmRlNDAwYjM3Il0sImNvdW50cnlHcm91cCI6IklOIiwib25lUm9sZXMiOltdLCJ0eXBlIjoiVVNFUiJ9LCJpYXQiOjE3NjY0MjU2NjF9.iVAtjVsTasXYlynpxcbxTUuQoMAucebXmebPSnCMN60",
    "client-id": "5eb393ee95fab7468a79d189",
    "client-type": "WEB",
    "client-version": "200",
    "content-type": "application/json",
    "if-none-match": "W/\"59-n6t2GjQCYIo7TAQVstCPU/zIklE\"",
    "priority": "u=1, i",
    "randomid": "b28ff422-18c7-445e-8e97-01329cac8cbc",
    "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "Referer": "https://www.pw.live/"
  },
  "body": null,
  "method": "GET"

});
    const data  = await reponose.json()
    console.log(data)
})()
