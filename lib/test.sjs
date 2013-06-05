macro def {
  case $name:ident $params $body => {
    function $name $params $body
  }
}

def sweet(a) {
  console.log("Macros are sweet!");
}
