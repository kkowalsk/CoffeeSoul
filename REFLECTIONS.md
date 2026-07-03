# secrets 
claude overwrote a .env file that contained secrets that were .gitignored
it was retrievable by claude as the file was cat'ted during the session

0) can directories / files be blacklisted from claude read/write?
0) look into local agent only tools to prevent uploading of sensitive data

# docker verify patterns
claude used a verify pattern of spinning up test containers to check changes

# curl pretty print
curl -s <url> | python3 -m json.tool