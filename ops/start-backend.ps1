Set-Location 'c:\Users\shyamkumar\oose pro\backend'
& 'C:\tools\apache-maven-3.9.12-bin\apache-maven-3.9.12\bin\mvn.cmd' spring-boot:run *>&1 | Tee-Object -FilePath 'c:\Users\shyamkumar\oose pro\backend\spring-boot.out.log'
