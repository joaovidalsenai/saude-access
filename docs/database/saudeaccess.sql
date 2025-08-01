create table cliente(
	cliente_id int primary key auto_increment,
    cliente_nome varchar(100) not null,
    cliente_senha varchar(255) not null,
    client_cpf varchar(11) not null,
    cliente_nascimento date not null,
    client_cep varchar(8) not null,
    cliente_telefone varchar(15) not null,
    cliente_email varchar(100) not null unique,
    cliente_data_cadastro datetime default current_timestamp,
    client_ativo boolean default true
)