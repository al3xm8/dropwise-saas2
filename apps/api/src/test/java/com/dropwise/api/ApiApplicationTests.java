package com.dropwise.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
	"aws.dynamodb-table=test-dropwise"
})
class ApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
